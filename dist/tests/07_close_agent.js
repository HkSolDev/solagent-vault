"use strict";
// ============================================================
// TEST 07: close_agent
// ============================================================
// Instruction: close_agent(agent_id)
//
// What this instruction does:
//   - If agent.balance > 0: sweeps all remaining USDC to owner ATA via CPI
//   - Uses Anchor's `close = owner` to drain the PDA's rent lamports to owner
//   - Decrements vault.agent_count by 1
//   - After this call: agent PDA account is fully closed (null on-chain)
//
// Accounts required:
//   - vault_state         : vault PDA (agent_count decremented)
//   - agent_state         : agent PDA to close (close = owner)
//   - owner               : signer + receives rent
//   - agent_token_account : agent's USDC ATA (swept if balance > 0)
//   - owner_token_account : owner's USDC ATA (receives swept tokens)
//   - usdc_mint
//   - token_program
//
// NOTE: Self-contained. Creates vault, agent (agentId=40), mints USDC,
//       deposits 50 USDC, then closes the agent fully.
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
const spl_token_1 = require("@solana/spl-token");
const chai_1 = require("chai");
describe("07 - close_agent", () => {
    // ── Provider & Program Setup ────────────────────────────────
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.SolagentVault;
    const owner = provider.wallet;
    // ── Test Parameters ─────────────────────────────────────────
    const agentId = new anchor.BN(40); // unique ID for this test
    const depositAmount = new anchor.BN(50_000_000); // deposit 50 USDC upfront
    // ── Accounts ─────────────────────────────────────────────────
    let vaultStatePda;
    let agentStatePda;
    let usdcMint;
    let ownerTokenAccount;
    let agentTokenAccount;
    const agentSigner = anchor.web3.Keypair.generate();
    before(async () => {
        // 1. Derive vault PDA
        [vaultStatePda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("vault"), owner.publicKey.toBuffer()], program.programId);
        // 2. Initialize vault only if it doesn't already exist
        const vaultInfo = await provider.connection.getAccountInfo(vaultStatePda);
        if (!vaultInfo) {
            await program.methods.initializeVault()
                .accountsStrict({
                vaultState: vaultStatePda,
                owner: owner.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
                .rpc();
        }
        // 3. Derive agent PDA
        [agentStatePda] = anchor.web3.PublicKey.findProgramAddressSync([
            Buffer.from("agent"),
            vaultStatePda.toBuffer(),
            agentId.toArrayLike(Buffer, "le", 8),
        ], program.programId);
        // 4. Create agent (agentId=40)
        await program.methods
            .createAgent(agentId, new anchor.BN(10_000_000), new anchor.BN(15_000_000), Array(5).fill(anchor.web3.PublicKey.default), new anchor.BN(100_000_000))
            .accountsStrict({
            vaultState: vaultStatePda,
            agentState: agentStatePda,
            agentSigner: agentSigner.publicKey,
            owner: owner.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
            .rpc();
        // 5. Create USDC mint
        usdcMint = await (0, spl_token_1.createMint)(provider.connection, owner.payer, owner.publicKey, null, 6);
        // 6. Create & fund owner token account (100 USDC)
        ownerTokenAccount = await (0, spl_token_1.createAccount)(provider.connection, owner.payer, usdcMint, owner.publicKey);
        await (0, spl_token_1.mintTo)(provider.connection, owner.payer, usdcMint, ownerTokenAccount, owner.publicKey, 100_000_000);
        // 7. Create agent ATA
        agentTokenAccount = await (0, spl_token_1.createAssociatedTokenAccount)(provider.connection, owner.payer, usdcMint, agentStatePda, undefined, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, true);
        // 8. Deposit 50 USDC into the agent
        await program.methods
            .deposit(depositAmount, agentId)
            .accountsStrict({
            vaultState: vaultStatePda,
            agentState: agentStatePda,
            owner: owner.publicKey,
            ownerTokenAccount: ownerTokenAccount,
            agentTokenAccount: agentTokenAccount,
            usdcMint: usdcMint,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
            .rpc();
        console.log("\n  --- Setup Complete ---");
        console.log("  Agent PDA         :", agentStatePda.toString());
        console.log("  Agent balance     : 50 USDC (will be swept on close)");
    });
    it("Closes the agent, sweeps 50 USDC to owner, and reclaims rent", async () => {
        // Read state BEFORE close
        const vaultBefore = await program.account.vaultState.fetch(vaultStatePda);
        const ownerBalBefore = (await (0, spl_token_1.getAccount)(provider.connection, ownerTokenAccount)).amount;
        const agentBalBefore = (await (0, spl_token_1.getAccount)(provider.connection, agentTokenAccount)).amount;
        const agentStateBefore = await program.account.agentState.fetch(agentStatePda);
        console.log("\n  --- Before Close ---");
        console.log("  vault.agentCount  :", vaultBefore.agentCount);
        console.log("  agent.balance     :", agentStateBefore.balance.toString(), "(50 USDC)");
        console.log("  agent token acct  :", agentBalBefore.toString());
        console.log("  owner token acct  :", ownerBalBefore.toString());
        // ── Call the instruction ──────────────────────────────────
        await program.methods
            .closeAgent(agentId)
            .accountsStrict({
            vaultState: vaultStatePda,
            agentState: agentStatePda,
            owner: owner.publicKey,
            agentTokenAccount: agentTokenAccount,
            ownerTokenAccount: ownerTokenAccount,
            usdcMint: usdcMint,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        })
            .rpc();
        // ── Fetch state AFTER close ───────────────────────────────
        const vaultAfter = await program.account.vaultState.fetch(vaultStatePda);
        const ownerBalAfter = (await (0, spl_token_1.getAccount)(provider.connection, ownerTokenAccount)).amount;
        // 1. Agent PDA account must be FULLY CLOSED (null = no account on-chain)
        const agentAccountInfo = await provider.connection.getAccountInfo(agentStatePda);
        chai_1.assert.isNull(agentAccountInfo, "agent PDA should be closed and return null");
        // 2. vault.agentCount must decrement by 1
        chai_1.assert.equal(vaultAfter.agentCount, vaultBefore.agentCount - 1, "vault.agentCount should decrement by 1 after close");
        // 3. Owner must receive the swept USDC (all 50 USDC from agent)
        chai_1.assert.equal((ownerBalAfter - ownerBalBefore).toString(), agentStateBefore.balance.toString(), "owner should receive all remaining USDC from the agent");
        console.log("\n  --- After Close ---");
        console.log("  agent PDA         : null (account closed ✓)");
        console.log("  vault.agentCount  :", vaultAfter.agentCount, "(decremented)");
        console.log("  owner received    :", (ownerBalAfter - ownerBalBefore).toString(), "USDC lamports (50 USDC swept)");
        console.log("  owner token acct  :", ownerBalAfter.toString(), "(back to 100 USDC)");
    });
});
