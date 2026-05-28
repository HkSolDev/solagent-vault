"use strict";
// ============================================================
// TEST 06: withdraw
// ============================================================
// Instruction: withdraw(amount, agent_id)
//
// What this instruction does:
//   - Validates: agent.balance >= amount (InsufficientBalance guard)
//   - CPI transfers tokens: agent ATA -> owner ATA
//   - Updates agent.balance by -amount
//   - Only the developer/owner can call this (has_one = owner)
//
// Accounts required:
//   - agent_state         : existing agent PDA
//   - owner               : signer
//   - agent_token_account : agent's USDC ATA (source)
//   - owner_token_account : owner's USDC ATA (destination)
//   - usdc_mint
//   - token_program
//
// NOTE: Self-contained. Creates vault, agent (agentId=30), mints USDC,
//       deposits 50 USDC, then withdraws a partial amount.
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
describe("06 - withdraw", () => {
    // ── Provider & Program Setup ────────────────────────────────
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.SolagentVault;
    const owner = provider.wallet;
    // ── Test Parameters ─────────────────────────────────────────
    const agentId = new anchor.BN(30); // unique ID for this test
    const depositAmount = new anchor.BN(50_000_000); // deposit 50 USDC
    const withdrawAmount = new anchor.BN(20_000_000); // withdraw 20 USDC
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
        // 4. Create agent (agentId=30)
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
        console.log("  Agent PDA        :", agentStatePda.toString());
        console.log("  Deposited        : 50 USDC");
        console.log("  Withdraw Amount  : 20 USDC");
        console.log("  Expected Remaining: 30 USDC");
    });
    it("Withdraws 20 USDC from agent back to owner (partial withdraw)", async () => {
        // Read state BEFORE withdraw
        const agentBefore = await program.account.agentState.fetch(agentStatePda);
        const ownerBalBefore = (await (0, spl_token_1.getAccount)(provider.connection, ownerTokenAccount)).amount;
        const agentBalBefore = (await (0, spl_token_1.getAccount)(provider.connection, agentTokenAccount)).amount;
        // ── Call the instruction ──────────────────────────────────
        await program.methods
            .withdraw(withdrawAmount, agentId)
            .accountsStrict({
            agentState: agentStatePda,
            owner: owner.publicKey,
            agentTokenAccount: agentTokenAccount,
            ownerTokenAccount: ownerTokenAccount,
            usdcMint: usdcMint,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        })
            .rpc();
        // ── Fetch state AFTER withdraw ────────────────────────────
        const agentAfter = await program.account.agentState.fetch(agentStatePda);
        const ownerBalAfter = (await (0, spl_token_1.getAccount)(provider.connection, ownerTokenAccount)).amount;
        const agentBalAfter = (await (0, spl_token_1.getAccount)(provider.connection, agentTokenAccount)).amount;
        // ── Assertions ────────────────────────────────────────────
        // 1. agent.balance must decrease by withdraw amount
        chai_1.assert.equal(agentAfter.balance.toString(), (BigInt(agentBefore.balance.toString()) - BigInt(withdrawAmount.toString())).toString(), "agent.balance should decrease by withdraw amount");
        // 2. Agent token account must be debited
        chai_1.assert.equal((agentBalBefore - agentBalAfter).toString(), withdrawAmount.toString(), "agent token account should be debited by withdraw amount");
        // 3. Owner token account must be credited
        chai_1.assert.equal((ownerBalAfter - ownerBalBefore).toString(), withdrawAmount.toString(), "owner token account should receive the withdraw amount");
        // 4. Remaining balance must be correct (50 - 20 = 30 USDC)
        chai_1.assert.equal(agentAfter.balance.toString(), "30000000", "agent should have 30 USDC remaining");
        // ── Print state for easy visual verification ──────────────
        console.log("\n  --- Before Withdraw ---");
        console.log("  agent.balance      :", agentBefore.balance.toString(), "(50 USDC)");
        console.log("  agent token account:", agentBalBefore.toString());
        console.log("  owner token account:", ownerBalBefore.toString());
        console.log("\n  --- After Withdraw (20 USDC) ---");
        console.log("  agent.balance      :", agentAfter.balance.toString(), "(30 USDC remaining)");
        console.log("  agent token account:", agentBalAfter.toString(), "(30 USDC)");
        console.log("  owner token account:", ownerBalAfter.toString(), "(received +20 USDC)");
    });
    it("Reverts when withdrawing more than agent balance (InsufficientBalance)", async () => {
        const tooMuch = new anchor.BN(999_000_000); // 999 USDC, far more than 30 remaining
        try {
            await program.methods
                .withdraw(tooMuch, agentId)
                .accountsStrict({
                agentState: agentStatePda,
                owner: owner.publicKey,
                agentTokenAccount: agentTokenAccount,
                ownerTokenAccount: ownerTokenAccount,
                usdcMint: usdcMint,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            })
                .rpc();
            chai_1.assert.fail("Should have reverted with InsufficientBalance");
        }
        catch (err) {
            chai_1.assert.include(err.message, "InsufficientBalance", "Error should be InsufficientBalance");
            console.log("\n  [Guard Test] Correctly rejected overdraft:", err.message.includes("InsufficientBalance") ? "InsufficientBalance ✓" : err.message);
        }
    });
});
