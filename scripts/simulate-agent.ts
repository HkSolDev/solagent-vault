import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { SolagentVault } from "../target/types/solagent_vault";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

// SolAgent Vault Off-Chain Agent & HTTP 402 Intercept Simulator
async function runSimulation() {
  console.log("==================================================================");
  console.log("🤖 SOLAGENT VAULT: HTTP 402 INTERCEPT & SPEND POLICY SIMULATOR");
  console.log("==================================================================\n");

  // 1. Setup local Solana Connection safely (with automatic fallbacks)
  let provider: anchor.AnchorProvider;
  if (!process.env.ANCHOR_PROVIDER_URL) {
    const connection = new anchor.web3.Connection("http://127.0.0.1:8899", "confirmed");
    let wallet: anchor.Wallet;
    try {
      wallet = anchor.Wallet.local();
    } catch {
      const fallbackKeypair = anchor.web3.Keypair.generate();
      wallet = new anchor.Wallet(fallbackKeypair);
    }
    provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  } else {
    provider = anchor.AnchorProvider.env();
  }
  anchor.setProvider(provider);

  // Load Program directly via the target IDL to prevent anchor workspace workspace injection errors
  const idlPath = path.join(__dirname, "../target/idl/solagent_vault.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const program = new Program(idl, provider) as unknown as Program<SolagentVault>;
  const owner = provider.wallet as anchor.Wallet;

  // Ensure owner wallet has SOL to deploy, fund, and run instructions on localnet
  const ownerBalance = await provider.connection.getBalance(owner.publicKey);
  if (ownerBalance === 0) {
    console.log("💧 Localnet detected. Airdropping SOL to owner for transaction fees...");
    const signature = await provider.connection.requestAirdrop(owner.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    
    // In Solana web3 v1.x, wait for confirmation
    const latestBlockHash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature
    });
  }

  console.log("🛡️ Loaded Anchor IDL map successfully.");

  // 2. Load the SKILL.md instructions into the Agent's simulated context
  const skillPath = path.join(__dirname, "../SKILL.md");
  const skillContent = fs.readFileSync(skillPath, "utf8");
  console.log("📚 Loaded SKILL.md into Agent's cognitive instruction engine.");

  // 3. Generate Agent Throwaway Signing Key & Mock Provider Wallet
  const agentSigner = anchor.web3.Keypair.generate();
  const providerWallet = anchor.web3.Keypair.generate();
  const agentId = new anchor.BN(888); // Unique ID for simulator

  // 4. Derive PDAs
  const [vaultStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), owner.publicKey.toBuffer()],
    program.programId
  );

  const [agentStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("agent"),
      vaultStatePda.toBuffer(),
      agentId.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  console.log(`🔑 Derived Agent PDA: ${agentStatePda.toString()}`);
  console.log(`🗝️ Generated Local Agent Signer: ${agentSigner.publicKey.toString()}`);

  // 5. Initialize Vault & Agent State On-Chain
  const vaultInfo = await provider.connection.getAccountInfo(vaultStatePda);
  if (!vaultInfo) {
    console.log("⚙️ Initializing Developer Vault...");
    await program.methods.initializeVault()
      .accountsStrict({
        vaultState: vaultStatePda,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
  }

  console.log("🚀 Creating Active Agent with strict spending rules:");
  console.log("   - Max Per Call: 10 USDC");
  console.log("   - Max Per Minute: 15 USDC");

  await program.methods
    .createAgent(
      agentId,
      new anchor.BN(10_000_000), // 10 USDC
      new anchor.BN(15_000_000), // 15 USDC
      Array(5).fill(anchor.web3.PublicKey.default), // open allowlist
      new anchor.BN(100_000_000), // 0.1 SOL gas tank allocation
    )
    .accountsStrict({
      vaultState: vaultStatePda,
      agentState: agentStatePda,
      agentSigner: agentSigner.publicKey,
      owner: owner.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  // Create Mock Mint and fund Agent
  const usdcMint = await createMint(
    provider.connection, owner.payer, owner.publicKey, null, 6
  );

  const ownerTokenAccount = await createAccount(
    provider.connection, owner.payer, usdcMint, owner.publicKey
  );
  await mintTo(
    provider.connection, owner.payer, usdcMint, ownerTokenAccount,
    owner.publicKey, 100_000_000 // 100 USDC
  );

  const agentTokenAccount = await createAssociatedTokenAccount(
    provider.connection, owner.payer, usdcMint, agentStatePda,
    undefined, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, true
  );

  // Deposit 50 USDC into the agent's sandboxed ATA
  await program.methods
    .deposit(new anchor.BN(50_000_000), agentId)
    .accountsStrict({
      vaultState: vaultStatePda,
      agentState: agentStatePda,
      owner: owner.publicKey,
      ownerTokenAccount: ownerTokenAccount,
      agentTokenAccount: agentTokenAccount,
      usdcMint: usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  const providerTokenAccount = await createAccount(
    provider.connection, owner.payer, usdcMint, providerWallet.publicKey
  );

  console.log("💰 Vault funded with 50 USDC. Simulation initialized.\n");

  // 6. SIMULATION RUN: Agent attempts API request and intercepts 402 challenge
  console.log("--- ⚡ SIMULATING LLM REQUEST WINDOW ---");
  
  // A mock API server returns an HTTP 402 response payload
  const mock402Payload = {
    error: "Payment Required",
    status: 402,
    amount: 5_000_000, // 5 USDC
    mint: usdcMint.toString(),
    destination: providerWallet.publicKey.toString(),
    agentId: agentId.toNumber()
  };

  console.log("❌ LLM Request hit a Paywall! Received HTTP 402 Error.");
  console.log(`📋 Paywall Demanded: ${mock402Payload.amount / 1_000_000} USDC to destination ${mock402Payload.destination}`);

  // 7. Agent evaluates the SKILL.md to decide how to act
  console.log("\n🧠 Agent Consulting SKILL.md...");
  const hasSpendCapability = skillContent.includes("spend");
  if (hasSpendCapability) {
    console.log("✅ Match Found! SKILL.md describes the 'spend' capability. Executing policy check...");
  }

  // 8. Execute the Spend under on-chain guardrails
  console.log("💸 Signing and executing Spend Transaction via Solana Vault...");
  try {
    const tx = await program.methods
      .spend(new anchor.BN(mock402Payload.amount), agentId)
      .accountsStrict({
        agentState: agentStatePda,
        agentSigner: agentSigner.publicKey,
        agentTokenAccount: agentTokenAccount,
        usdcMint: usdcMint,
        providerWallet: providerWallet.publicKey,
        providerTokenAccount: providerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([agentSigner])
      .rpc();

    console.log(`🎉 Spend Tx Succeeded! Hash: ${tx}`);

    // Verify balances
    const agentTokenAfter = (await getAccount(provider.connection, agentTokenAccount)).amount;
    const providerBalAfter = (await getAccount(provider.connection, providerTokenAccount)).amount;
    console.log(`🏦 Agent remaining balance   : ${Number(agentTokenAfter) / 1_000_000} USDC`);
    console.log(`🏥 Provider received balance : ${Number(providerBalAfter) / 1_000_000} USDC`);

    console.log("\n🔄 Retrying mock LLM Request with transaction proof...");
    console.log("✅ API Success! LLM completed the task successfully. 🤖🚀");

  } catch (err: any) {
    console.error("❌ Policy Reverted Spend Attempt:", err.message);
  }
}

runSimulation();
