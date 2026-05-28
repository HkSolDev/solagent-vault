// ============================================================
// TEST 05: set_config
// ============================================================
// Instruction: set_config(status, max_per_call, max_per_minute, allowed_providers)
//
// What this instruction does:
//   - All 4 parameters are Option<T> — only fields passed as Some(...) are updated
//   - Allows the developer to: pause/unpause agent, change spending limits,
//     update the provider allowlist — any combination in one call
//
// Accounts required:
//   - agent_state : existing agent PDA
//   - owner       : signer (must be the agent's owner)
//
// NOTE: This test is self-contained. It creates a fresh agent (agentId=20)
//       and tests three separate config update scenarios.
// ============================================================

import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { SolagentVault } from "../target/types/solagent_vault";
import { assert } from "chai";

describe("05 - set_config", () => {
  // ── Provider & Program Setup ────────────────────────────────
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolagentVault as Program<SolagentVault>;
  const owner = provider.wallet as anchor.Wallet;

  // ── Test Parameters ─────────────────────────────────────────
  const agentId = new anchor.BN(20); // unique ID for this test

  // ── Accounts ─────────────────────────────────────────────────
  let vaultStatePda: anchor.web3.PublicKey;
  let agentStatePda: anchor.web3.PublicKey;
  const agentSigner = anchor.web3.Keypair.generate();

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

    // 4. Create a fresh agent (agentId=20)
    await program.methods
      .createAgent(
        agentId,
        new anchor.BN(10_000_000),  // maxPerCall: 10 USDC
        new anchor.BN(15_000_000),  // maxPerMinute: 15 USDC
        Array(5).fill(anchor.web3.PublicKey.default),
        new anchor.BN(100_000_000), // 0.1 SOL gas
      )
      .accountsStrict({
        vaultState   : vaultStatePda,
        agentState   : agentStatePda,
        agentSigner  : agentSigner.publicKey,
        owner        : owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("\n  --- Addresses ---");
    console.log("  Agent PDA   :", agentStatePda.toString());
    console.log("  Agent Signer:", agentSigner.publicKey.toString());
  });

  // ── Test 1: Pause the agent ───────────────────────────────
  it("Pauses the agent (status -> Paused)", async () => {
    const before = await program.account.agentState.fetch(agentStatePda);
    assert.deepEqual(before.status, { active: {} }, "should start as Active");

    await program.methods
      .setConfig(
        { paused: {} }, // status = Paused
        null,           // maxPerCall unchanged
        null,           // maxPerMinute unchanged
        null,           // allowedProviders unchanged
      )
      .accountsStrict({
        agentState: agentStatePda,
        owner     : owner.publicKey,
      })
      .rpc();

    const after = await program.account.agentState.fetch(agentStatePda);
    assert.deepEqual(after.status, { paused: {} },
      "agent.status should now be Paused");

    // Other fields must remain unchanged
    assert.equal(after.maxPerCall.toString(), before.maxPerCall.toString(),
      "maxPerCall should be unchanged");
    assert.equal(after.maxPerMinute.toString(), before.maxPerMinute.toString(),
      "maxPerMinute should be unchanged");

    console.log("\n  [Pause Test]");
    console.log("  status before :", JSON.stringify(before.status));
    console.log("  status after  :", JSON.stringify(after.status));
  });

  // ── Test 2: Update spending limits ───────────────────────
  it("Updates maxPerCall and maxPerMinute limits", async () => {
    const before = await program.account.agentState.fetch(agentStatePda);

    const newMaxPerCall   = new anchor.BN(5_000_000);  // changed: 10 -> 5 USDC
    const newMaxPerMinute = new anchor.BN(20_000_000); // changed: 15 -> 20 USDC

    await program.methods
      .setConfig(
        null,            // status unchanged (stays Paused from test 1)
        newMaxPerCall,   // update maxPerCall
        newMaxPerMinute, // update maxPerMinute
        null,            // allowedProviders unchanged
      )
      .accountsStrict({
        agentState: agentStatePda,
        owner     : owner.publicKey,
      })
      .rpc();

    const after = await program.account.agentState.fetch(agentStatePda);
    assert.equal(after.maxPerCall.toString(), newMaxPerCall.toString(),
      "maxPerCall should be updated to 5 USDC");
    assert.equal(after.maxPerMinute.toString(), newMaxPerMinute.toString(),
      "maxPerMinute should be updated to 20 USDC");

    // Status unchanged from test 1
    assert.deepEqual(after.status, { paused: {} },
      "status should still be Paused (unchanged)");

    console.log("\n  [Limits Test]");
    console.log("  maxPerCall before  :", before.maxPerCall.toString(), "(10 USDC)");
    console.log("  maxPerCall after   :", after.maxPerCall.toString(), "(5 USDC)");
    console.log("  maxPerMinute before:", before.maxPerMinute.toString(), "(15 USDC)");
    console.log("  maxPerMinute after :", after.maxPerMinute.toString(), "(20 USDC)");
    console.log("  status (unchanged) :", JSON.stringify(after.status));
  });

  // ── Test 3: Reactivate the agent ─────────────────────────
  it("Reactivates the agent (status -> Active)", async () => {
    await program.methods
      .setConfig(
        { active: {} }, // status = Active again
        null,
        null,
        null,
      )
      .accountsStrict({
        agentState: agentStatePda,
        owner     : owner.publicKey,
      })
      .rpc();

    const after = await program.account.agentState.fetch(agentStatePda);
    assert.deepEqual(after.status, { active: {} },
      "agent.status should be Active again");

    console.log("\n  [Reactivate Test]");
    console.log("  status after:", JSON.stringify(after.status), "(back to Active)");
  });
});
