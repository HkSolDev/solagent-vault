import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { SolagentVault } from "../target/types/solagent_vault";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  createAccount, 
  mintTo, 
  getAccount
} from "@solana/spl-token";
import { assert } from "chai";

describe("solagent-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolagentVault as Program<SolagentVault>;
  const owner = provider.wallet as anchor.Wallet;

  let usdcMint: anchor.web3.PublicKey;
  let ownerTokenAccount: anchor.web3.PublicKey;
  
  let vaultStatePda: anchor.web3.PublicKey;
  let vaultStateBump: number;

  const agentId = new anchor.BN(0);
  let agentStatePda: anchor.web3.PublicKey;
  let agentStateBump: number;
  let agentTokenAccount: anchor.web3.PublicKey;
  const agentSigner = anchor.web3.Keypair.generate();

  const providerWallet = anchor.web3.Keypair.generate();
  let providerTokenAccount: anchor.web3.PublicKey;

  before(async () => {
    // 1. Create a mock USDC Mint
    usdcMint = await createMint(
      provider.connection,
      owner.payer,
      owner.publicKey,
      null,
      6
    );

    // 2. Create Owner Token Account and mint initial tokens (100 USDC)
    ownerTokenAccount = await createAccount(
      provider.connection,
      owner.payer,
      usdcMint,
      owner.publicKey
    );
    await mintTo(
      provider.connection,
      owner.payer,
      usdcMint,
      ownerTokenAccount,
      owner.publicKey,
      100_000_000 // 100 USDC (6 decimals)
    );

    // 3. Derive Vault PDA
    const [vPda, vBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.publicKey.toBuffer()],
      program.programId
    );
    vaultStatePda = vPda;
    vaultStateBump = vBump;

    // 4. Derive Agent PDA
    const [aPda, aBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("agent"),
        vaultStatePda.toBuffer(),
        agentId.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    agentStatePda = aPda;
    agentStateBump = aBump;

    // 5. Create Token Account owned by the Agent PDA
    agentTokenAccount = await createAccount(
      provider.connection,
      owner.payer,
      usdcMint,
      agentStatePda
    );

    // 6. Create Provider Token Account
    providerTokenAccount = await createAccount(
      provider.connection,
      owner.payer,
      usdcMint,
      providerWallet.publicKey
    );

    // Airdrop SOL to agent signer for transaction gas fees
    const signature = await provider.connection.requestAirdrop(
      agentSigner.publicKey,
      1_000_000_000 // 1 SOL
    );
    await provider.connection.confirmTransaction(signature);
  });

  it("Initializes the master vault", async () => {
    await program.methods
      .initializeVault()
      .accounts({
        vaultState: vaultStatePda,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const vault = await program.account.vaultState.fetch(vaultStatePda);
    assert.equal(vault.owner.toString(), owner.publicKey.toString());
    assert.equal(vault.agentCount, 0);
    assert.equal(vault.totalDeposited.toString(), "0");
  });

  it("Creates an active agent PDA with spend caps", async () => {
    const maxPerCall = new anchor.BN(10_000_000); // 10 USDC cap per call
    const maxPerMinute = new anchor.BN(15_000_000); // 15 USDC cap per minute
    
    // Empty allowlist (allows all providers for simplicity in basic tests)
    const allowedProviders = Array(5).fill(anchor.web3.PublicKey.default);

    await program.methods
      .createAgent(
        agentId,
        agentSigner.publicKey,
        maxPerCall,
        maxPerMinute,
        allowedProviders
      )
      .accounts({
        vaultState: vaultStatePda,
        agentState: agentStatePda,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const agent = await program.account.agentState.fetch(agentStatePda);
    assert.equal(agent.vault.toString(), vaultStatePda.toString());
    assert.equal(agent.owner.toString(), owner.publicKey.toString());
    assert.equal(agent.agentSigner.toString(), agentSigner.publicKey.toString());
    assert.equal(agent.balance.toString(), "0");
    assert.deepEqual(agent.status, { active: {} });
    assert.equal(agent.maxPerCall.toString(), maxPerCall.toString());
    assert.equal(agent.maxPerMinute.toString(), maxPerMinute.toString());
  });

  it("Deposits USDC into the Agent PDA account", async () => {
    const depositAmount = new anchor.BN(50_000_000); // 50 USDC

    await program.methods
      .deposit(depositAmount, agentId)
      .accounts({
        vaultState: vaultStatePda,
        agentState: agentStatePda,
        owner: owner.publicKey,
        ownerTokenAccount: ownerTokenAccount,
        agentTokenAccount: agentTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const agent = await program.account.agentState.fetch(agentStatePda);
    assert.equal(agent.balance.toString(), depositAmount.toString());

    const tokenBalance = await getAccount(provider.connection, agentTokenAccount);
    assert.equal(tokenBalance.amount.toString(), depositAmount.toString());
  });

  it("Agent performs a successful spend CPI payment", async () => {
    const spendAmount = new anchor.BN(5_000_000); // 5 USDC

    await program.methods
      .spend(spendAmount, agentId)
      .accounts({
        agentState: agentStatePda,
        agentSigner: agentSigner.publicKey,
        agentTokenAccount: agentTokenAccount,
        providerWallet: providerWallet.publicKey,
        providerTokenAccount: providerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([agentSigner])
      .rpc();

    const agent = await program.account.agentState.fetch(agentStatePda);
    assert.equal(agent.balance.toString(), "45000000"); // 45 USDC remaining
    assert.equal(agent.totalSpent.toString(), spendAmount.toString());
    assert.equal(agent.spentThisWindow.toString(), spendAmount.toString());

    const providerBalance = await getAccount(provider.connection, providerTokenAccount);
    assert.equal(providerBalance.amount.toString(), spendAmount.toString());
  });

  it("Reverts when spending exceeds single-call cap (max_per_call)", async () => {
    const excessiveAmount = new anchor.BN(12_000_000); // 12 USDC (Cap is 10 USDC)

    try {
      await program.methods
        .spend(excessiveAmount, agentId)
        .accounts({
          agentState: agentStatePda,
          agentSigner: agentSigner.publicKey,
          agentTokenAccount: agentTokenAccount,
          providerWallet: providerWallet.publicKey,
          providerTokenAccount: providerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([agentSigner])
        .rpc();
      assert.fail("Should have failed single-call cap check");
    } catch (err: any) {
      assert.include(err.message, "ExceedsMaxPerCall");
    }
  });

  it("Reverts when spending exceeds the rate limit (max_per_minute)", async () => {
    const spendAmount = new anchor.BN(11_000_000); // 11 USDC (Cap is 15. We already spent 5, so 5 + 11 = 16)

    try {
      await program.methods
        .spend(spendAmount, agentId)
        .accounts({
          agentState: agentStatePda,
          agentSigner: agentSigner.publicKey,
          agentTokenAccount: agentTokenAccount,
          providerWallet: providerWallet.publicKey,
          providerTokenAccount: providerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([agentSigner])
        .rpc();
      assert.fail("Should have failed rate limit cap check");
    } catch (err: any) {
      assert.include(err.message, "ExceedsRateLimit");
    }
  });

  it("Reverts when agent is paused by the developer", async () => {
    // 1. Developer pauses agent
    await program.methods
      .setConfig({ paused: {} }, null, null, null)
      .accounts({
        agentState: agentStatePda,
        owner: owner.publicKey,
      })
      .rpc();

    // 2. Try to spend
    const spendAmount = new anchor.BN(1_000_000); // 1 USDC
    try {
      await program.methods
        .spend(spendAmount, agentId)
        .accounts({
          agentState: agentStatePda,
          agentSigner: agentSigner.publicKey,
          agentTokenAccount: agentTokenAccount,
          providerWallet: providerWallet.publicKey,
          providerTokenAccount: providerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([agentSigner])
        .rpc();
      assert.fail("Should have failed pause check");
    } catch (err: any) {
      assert.include(err.message, "AgentNotActive");
    }
  });

  it("Allows developer to withdraw remaining USDC from the agent pda", async () => {
    const withdrawAmount = new anchor.BN(20_000_000); // 20 USDC

    await program.methods
      .withdraw(withdrawAmount, agentId)
      .accounts({
        agentState: agentStatePda,
        owner: owner.publicKey,
        agentTokenAccount: agentTokenAccount,
        ownerTokenAccount: ownerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const agent = await program.account.agentState.fetch(agentStatePda);
    assert.equal(agent.balance.toString(), "25000000"); // 45 - 20 = 25 USDC remaining
  });

  it("Allows developer to close the agent and reclaim rent and leftover USDC", async () => {
    const initialOwnerBalance = (await getAccount(provider.connection, ownerTokenAccount)).amount;

    await program.methods
      .closeAgent(agentId)
      .accounts({
        vaultState: vaultStatePda,
        agentState: agentStatePda,
        owner: owner.publicKey,
        agentTokenAccount: agentTokenAccount,
        ownerTokenAccount: ownerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // 1. Verify PDA account is closed and rent reclaimed (PDA should have 0 lamports)
    const accountInfo = await provider.connection.getAccountInfo(agentStatePda);
    assert.isNull(accountInfo);

    // 2. Verify leftover 25 USDC swept to the owner
    const finalOwnerBalance = (await getAccount(provider.connection, ownerTokenAccount)).amount;
    assert.equal((finalOwnerBalance - initialOwnerBalance).toString(), "25000000");
  });
});
