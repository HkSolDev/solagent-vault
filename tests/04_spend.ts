// ============================================================
// TEST 04: spend
// ============================================================
// Instruction: spend(amount, agent_id)
//
// What this instruction does:
//   - Validates: agent is Active, provider is allowed, amount <= maxPerCall,
//     new window total <= maxPerMinute, agent has enough balance
//   - Executes a CPI token transfer: agent ATA -> provider ATA
//   - Updates: agent.balance, agent.spentThisWindow, agent.totalSpent
//
// Accounts required:
//   - agent_state         : existing agent PDA (signer-constrained)
//   - agent_signer        : the AI agent's keypair (must sign!)
//   - agent_token_account : agent's USDC ATA (source)
//   - usdc_mint
//   - provider_wallet     : the API provider receiving payment
//   - provider_token_account : provider's USDC ATA (destination)
//   - token_program
//
// NOTE: This test is self-contained. It sets up vault, agent,
//       USDC mint, token accounts, and deposits before spending.
// ============================================================

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
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { assert } from "chai";

describe("04 - spend", () => {
  // ── Provider & Program Setup ────────────────────────────────
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolagentVault as Program<SolagentVault>;
  const owner = provider.wallet as anchor.Wallet;

  // ── Test Parameters ─────────────────────────────────────────
  const agentId       = new anchor.BN(10);         // unique ID for this test
  const depositAmount = new anchor.BN(50_000_000);  // 50 USDC deposited upfront
  const spendAmount   = new anchor.BN(5_000_000);   // 5 USDC spend (within all limits)

  // ── Accounts ─────────────────────────────────────────────────
  let vaultStatePda     : anchor.web3.PublicKey;
  let agentStatePda     : anchor.web3.PublicKey;
  let usdcMint          : anchor.web3.PublicKey;
  let ownerTokenAccount : anchor.web3.PublicKey;
  let agentTokenAccount : anchor.web3.PublicKey;
  let providerTokenAccount: anchor.web3.PublicKey;
  const agentSigner    = anchor.web3.Keypair.generate();
  const providerWallet = anchor.web3.Keypair.generate();

  before(async () => {
    // 1. Derive vault PDA
    [vaultStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.publicKey.toBuffer()],
      program.programId
    );

    // 2. Initialize vault only if it doesn't already exist
    const vaultInfo = await provider.connection.getAccountInfo(vaultStatePda);
    if (!vaultInfo) {
      await program.methods.initializeVault()
        .accountsStrict({
          vaultState   : vaultStatePda,
          owner        : owner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    }

    // 3. Derive agent PDA
    [agentStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("agent"),
        vaultStatePda.toBuffer(),
        agentId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // 4. Create the agent (agentId=10, fresh for this test)
    await program.methods
      .createAgent(
        agentId,
        new anchor.BN(10_000_000),  // maxPerCall: 10 USDC
        new anchor.BN(15_000_000),  // maxPerMinute: 15 USDC
        Array(5).fill(anchor.web3.PublicKey.default), // open allowlist
        new anchor.BN(200_000_000), // 0.2 SOL gas
      )
      .accountsStrict({
        vaultState   : vaultStatePda,
        agentState   : agentStatePda,
        agentSigner  : agentSigner.publicKey,
        owner        : owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // 5. Create USDC mock mint
    usdcMint = await createMint(
      provider.connection, owner.payer, owner.publicKey, null, 6
    );

    // 6. Create & fund owner token account (100 USDC)
    ownerTokenAccount = await createAccount(
      provider.connection, owner.payer, usdcMint, owner.publicKey
    );
    await mintTo(
      provider.connection, owner.payer, usdcMint, ownerTokenAccount,
      owner.publicKey, 100_000_000
    );

    // 7. Create agent ATA (owned by agent PDA - off-curve, so allowOwnerOffCurve=true)
    agentTokenAccount = await createAssociatedTokenAccount(
      provider.connection, owner.payer, usdcMint, agentStatePda,
      undefined, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, true
    );

    // 8. Deposit 50 USDC into the agent
    await program.methods
      .deposit(depositAmount, agentId)
      .accountsStrict({
        vaultState            : vaultStatePda,
        agentState            : agentStatePda,
        owner                 : owner.publicKey,
        ownerTokenAccount     : ownerTokenAccount,
        agentTokenAccount     : agentTokenAccount,
        usdcMint              : usdcMint,
        tokenProgram          : TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram         : anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // 9. Create provider token account (receives the spend payment)
    providerTokenAccount = await createAccount(
      provider.connection, owner.payer, usdcMint, providerWallet.publicKey
    );

    console.log("\n  --- Addresses ---");
    console.log("  Agent PDA          :", agentStatePda.toString());
    console.log("  Agent Signer       :", agentSigner.publicKey.toString());
    console.log("  Provider Wallet    :", providerWallet.publicKey.toString());
    console.log("  Spend Amount       : 5 USDC (maxPerCall=10, maxPerMinute=15)");
  });

  it("Agent spends 5 USDC to a provider wallet", async () => {
    // Read state BEFORE spend
    const agentBefore       = await program.account.agentState.fetch(agentStatePda);
    const agentTokenBefore  = (await getAccount(provider.connection, agentTokenAccount)).amount;
    const providerBalBefore = (await getAccount(provider.connection, providerTokenAccount)).amount;

    // ── Call the instruction ──────────────────────────────────
    // NOTE: agentSigner must sign this transaction!
    await program.methods
      .spend(spendAmount, agentId)
      .accountsStrict({
        agentState          : agentStatePda,
        agentSigner         : agentSigner.publicKey,
        agentTokenAccount   : agentTokenAccount,
        usdcMint            : usdcMint,
        providerWallet      : providerWallet.publicKey,
        providerTokenAccount: providerTokenAccount,
        tokenProgram        : TOKEN_PROGRAM_ID,
      })
      .signers([agentSigner]) // the AI agent signs, NOT the developer!
      .rpc();

    // ── Fetch state AFTER spend ───────────────────────────────
    const agentAfter       = await program.account.agentState.fetch(agentStatePda);
    const agentTokenAfter  = (await getAccount(provider.connection, agentTokenAccount)).amount;
    const providerBalAfter = (await getAccount(provider.connection, providerTokenAccount)).amount;

    // ── Assertions ────────────────────────────────────────────

    // 1. agent.balance must decrease by spend amount
    assert.equal(
      agentAfter.balance.toString(),
      (BigInt(agentBefore.balance.toString()) - BigInt(spendAmount.toString())).toString(),
      "agent.balance should decrease by spend amount"
    );

    // 2. agent.totalSpent must increase by spend amount
    assert.equal(
      agentAfter.totalSpent.toString(),
      spendAmount.toString(),
      "agent.totalSpent should accumulate the spend"
    );

    // 3. agent.spentThisWindow must track the window spend
    assert.equal(
      agentAfter.spentThisWindow.toString(),
      spendAmount.toString(),
      "agent.spentThisWindow should record 5 USDC"
    );

    // 4. Agent token account must be debited
    assert.equal(
      (agentTokenBefore - agentTokenAfter).toString(),
      spendAmount.toString(),
      "agent token account should be debited by spend amount"
    );

    // 5. Provider token account must be credited
    assert.equal(
      (providerBalAfter - providerBalBefore).toString(),
      spendAmount.toString(),
      "provider token account should receive the spend amount"
    );

    // ── Print state for easy visual verification ──────────────
    console.log("\n  --- Before Spend ---");
    console.log("  agent.balance       :", agentBefore.balance.toString(), "(50 USDC)");
    console.log("  agent.totalSpent    :", agentBefore.totalSpent.toString());
    console.log("  agent.spentThisWindow:", agentBefore.spentThisWindow.toString());
    console.log("  agent token balance :", agentTokenBefore.toString());
    console.log("  provider balance    :", providerBalBefore.toString());

    console.log("\n  --- After Spend ---");
    console.log("  agent.balance       :", agentAfter.balance.toString(), "(45 USDC)");
    console.log("  agent.totalSpent    :", agentAfter.totalSpent.toString(), "(5 USDC spent total)");
    console.log("  agent.spentThisWindow:", agentAfter.spentThisWindow.toString(), "(5 USDC this minute)");
    console.log("  agent token balance :", agentTokenAfter.toString(), "(45 USDC on-chain)");
    console.log("  provider received   :", providerBalAfter.toString(), "(5 USDC)");
  });
});
