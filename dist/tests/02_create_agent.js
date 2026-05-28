"use strict";
// ============================================================
// TEST 02: create_agent
// ============================================================
// Instruction: create_agent(agent_id, max_per_call, max_per_minute,
//                           allowed_providers, sol_allocation)
//
// What this instruction does:
//   - Creates a new AgentState PDA seeded by [agent, vault, agent_id]
//   - Stores spending limits, signer pubkey, and initializes counters
//   - Transfers sol_allocation lamports from owner -> agent_signer keypair
//
// Accounts required:
//   - vault_state   : existing vault PDA (must already be initialized)
//   - agent_state   : new PDA to be created (init)
//   - agent_signer  : throwaway keypair that will sign future spends
//   - owner         : signer + payer
//   - system_program
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@anchor-lang/core"));
const chai_1 = require("chai");
describe("02 - create_agent", () => {
    // ── Provider & Program Setup ────────────────────────────────
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.SolagentVault;
    const owner = provider.wallet;
    // ── Test Parameters ─────────────────────────────────────────
    const agentId = new anchor.BN(1); // agent ID 1 (fresh, avoids clash with any prior runs)
    const maxPerCall = new anchor.BN(10_000_000); // 10 USDC single-call cap
    const maxPerMinute = new anchor.BN(15_000_000); // 15 USDC per-minute cap
    const solAllocation = new anchor.BN(200_000_000); // 0.2 SOL gas tank for agent keypair
    // Empty allowlist means ANY provider wallet is permitted
    const allowedProviders = Array(5).fill(anchor.web3.PublicKey.default);
    // ── PDAs & Keypairs ─────────────────────────────────────────
    let vaultStatePda;
    let agentStatePda;
    const agentSigner = anchor.web3.Keypair.generate(); // the AI agent's throwaway keypair
    before(async () => {
        // Derive the vault PDA (must already exist from test 01)
        [vaultStatePda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("vault"), owner.publicKey.toBuffer()], program.programId);
        // Derive the agent PDA
        // Seeds: ["agent", vault_pubkey, agent_id_as_8_bytes_little_endian]
        [agentStatePda] = anchor.web3.PublicKey.findProgramAddressSync([
            Buffer.from("agent"),
            vaultStatePda.toBuffer(),
            agentId.toArrayLike(Buffer, "le", 8),
        ], program.programId);
        console.log("\n  --- Addresses ---");
        console.log("  Owner         :", owner.publicKey.toString());
        console.log("  Vault PDA     :", vaultStatePda.toString());
        console.log("  Agent PDA     :", agentStatePda.toString());
        console.log("  Agent Signer  :", agentSigner.publicKey.toString());
    });
    it("Creates an agent PDA and funds the agent keypair with gas SOL", async () => {
        // ── Call the instruction ──────────────────────────────────
        await program.methods
            .createAgent(agentId, maxPerCall, maxPerMinute, allowedProviders, solAllocation)
            .accountsStrict({
            vaultState: vaultStatePda,
            agentState: agentStatePda,
            agentSigner: agentSigner.publicKey,
            owner: owner.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
            .rpc();
        // ── Fetch the newly created on-chain account ──────────────
        const agent = await program.account.agentState.fetch(agentStatePda);
        // ── Assertions ────────────────────────────────────────────
        // 1. The agent's vault pointer must link back to our vault PDA
        chai_1.assert.equal(agent.vault.toString(), vaultStatePda.toString(), "agent.vault should point to the correct vault PDA");
        // 2. The agent's owner must be the developer who called the instruction
        chai_1.assert.equal(agent.owner.toString(), owner.publicKey.toString(), "agent.owner should match the transaction signer");
        // 3. The agent's stored signer pubkey must match the keypair we generated
        chai_1.assert.equal(agent.agentSigner.toString(), agentSigner.publicKey.toString(), "agent.agentSigner should match the provided keypair");
        // 4. Initial token balance should be zero (no USDC deposited yet)
        chai_1.assert.equal(agent.balance.toString(), "0", "agent.balance should start at 0");
        // 5. Status must be Active right after creation
        chai_1.assert.deepEqual(agent.status, { active: {} }, "agent.status should be Active");
        // 6. Spending limits must be stored exactly as we sent them
        chai_1.assert.equal(agent.maxPerCall.toString(), maxPerCall.toString(), "agent.maxPerCall should match the parameter");
        chai_1.assert.equal(agent.maxPerMinute.toString(), maxPerMinute.toString(), "agent.maxPerMinute should match the parameter");
        // 7. Rate-limit counters must start clean
        chai_1.assert.equal(agent.spentThisWindow.toString(), "0", "agent.spentThisWindow should start at 0");
        chai_1.assert.equal(agent.totalSpent.toString(), "0", "agent.totalSpent should start at 0");
        // 8. The agent signer keypair must have received exactly 0.2 SOL
        const agentSignerBalance = await provider.connection.getBalance(agentSigner.publicKey);
        chai_1.assert.equal(agentSignerBalance, 200_000_000, "agentSigner should have received 0.2 SOL gas allocation");
        // ── Print state for easy visual verification ──────────────
        console.log("\n  --- On-chain Agent State ---");
        console.log("  vault         :", agent.vault.toString());
        console.log("  owner         :", agent.owner.toString());
        console.log("  agentSigner   :", agent.agentSigner.toString());
        console.log("  status        :", JSON.stringify(agent.status));
        console.log("  balance       :", agent.balance.toString(), "USDC lamports");
        console.log("  maxPerCall    :", agent.maxPerCall.toString(), "(10 USDC)");
        console.log("  maxPerMinute  :", agent.maxPerMinute.toString(), "(15 USDC)");
        console.log("  spentThisWindow:", agent.spentThisWindow.toString());
        console.log("  totalSpent    :", agent.totalSpent.toString());
        console.log("  SOL gas tank  :", agentSignerBalance, "lamports (0.2 SOL)");
    });
});
