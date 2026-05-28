"use strict";
// ============================================================
// TEST 03: deposit
// ============================================================
// Instruction: deposit(amount, agent_id)
//
// What this instruction does:
//   - Transfers USDC from the owner's token account -> agent's ATA
//   - Uses `init_if_needed` to create the agent ATA if it doesn't exist
//   - Updates agent.balance by +amount
//   - Updates vault.total_deposited by +amount
//
// Accounts required:
//   - vault_state         : existing vault PDA
//   - agent_state         : existing agent PDA (created in test 02)
//   - owner               : signer + payer
//   - owner_token_account : owner's USDC ATA (source of funds)
//   - agent_token_account : agent PDA's USDC ATA (destination, init_if_needed)
//   - usdc_mint           : the USDC mint
//   - token_program
//   - associated_token_program
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
const spl_token_1 = require("@solana/spl-token");
const chai_1 = require("chai");
describe("03 - deposit", () => {
    // ── Provider & Program Setup ────────────────────────────────
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.SolagentVault;
    const owner = provider.wallet;
    // ── Test Parameters ─────────────────────────────────────────
    const agentId = new anchor.BN(1); // same agent created in test 02
    const depositAmount = new anchor.BN(50_000_000); // 50 USDC (6 decimals)
    // ── Accounts ─────────────────────────────────────────────────
    let vaultStatePda;
    let agentStatePda;
    let usdcMint;
    let ownerTokenAccount;
    let agentTokenAccount;
    before(async () => {
        // 1. Derive vault PDA
        [vaultStatePda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("vault"), owner.publicKey.toBuffer()], program.programId);
        // 2. Derive agent PDA (must already exist from test 02)
        [agentStatePda] = anchor.web3.PublicKey.findProgramAddressSync([
            Buffer.from("agent"),
            vaultStatePda.toBuffer(),
            agentId.toArrayLike(Buffer, "le", 8),
        ], program.programId);
        // 3. Create a fresh USDC mock mint (6 decimals, owner is mint authority)
        usdcMint = await (0, spl_token_1.createMint)(provider.connection, owner.payer, owner.publicKey, // mint authority
        null, // freeze authority
        6 // decimals (USDC standard)
        );
        // 4. Create owner's token account and mint 100 USDC into it
        ownerTokenAccount = await (0, spl_token_1.createAccount)(provider.connection, owner.payer, usdcMint, owner.publicKey);
        await (0, spl_token_1.mintTo)(provider.connection, owner.payer, usdcMint, ownerTokenAccount, owner.publicKey, 100_000_000 // 100 USDC
        );
        // 5. Derive the agent's ATA address
        //    The ATA is owned by the agentStatePda (a PDA, off-curve address)
        agentTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(usdcMint, agentStatePda, true // allowOwnerOffCurve = true because agentStatePda is a PDA
        );
        console.log("\n  --- Addresses ---");
        console.log("  Vault PDA          :", vaultStatePda.toString());
        console.log("  Agent PDA          :", agentStatePda.toString());
        console.log("  USDC Mint          :", usdcMint.toString());
        console.log("  Owner Token Acct   :", ownerTokenAccount.toString());
        console.log("  Agent Token Acct   :", agentTokenAccount.toString());
        console.log("  Deposit Amount     : 50 USDC (50_000_000 lamports)");
    });
    it("Deposits 50 USDC into the agent's token account", async () => {
        // Read state BEFORE deposit for comparison
        const agentBefore = await program.account.agentState.fetch(agentStatePda);
        const vaultBefore = await program.account.vaultState.fetch(vaultStatePda);
        const ownerBalBefore = (await (0, spl_token_1.getAccount)(provider.connection, ownerTokenAccount)).amount;
        // ── Call the instruction ──────────────────────────────────
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
        // ── Fetch state AFTER deposit ─────────────────────────────
        const agentAfter = await program.account.agentState.fetch(agentStatePda);
        const vaultAfter = await program.account.vaultState.fetch(vaultStatePda);
        const ownerBalAfter = (await (0, spl_token_1.getAccount)(provider.connection, ownerTokenAccount)).amount;
        const agentTokenBal = (await (0, spl_token_1.getAccount)(provider.connection, agentTokenAccount)).amount;
        // ── Assertions ────────────────────────────────────────────
        // 1. agent.balance must increase by exactly the deposit amount
        const expectedAgentBalance = BigInt(agentBefore.balance.toString()) + BigInt(depositAmount.toString());
        chai_1.assert.equal(agentAfter.balance.toString(), expectedAgentBalance.toString(), "agent.balance should increase by deposit amount");
        // 2. vault.total_deposited must increase by exactly the deposit amount
        const expectedVaultTotal = BigInt(vaultBefore.totalDeposited.toString()) + BigInt(depositAmount.toString());
        chai_1.assert.equal(vaultAfter.totalDeposited.toString(), expectedVaultTotal.toString(), "vault.totalDeposited should increase by deposit amount");
        // 3. The agent's token account must hold exactly the deposit amount
        chai_1.assert.equal(agentTokenBal.toString(), depositAmount.toString(), "agent token account balance should equal deposited amount");
        // 4. Owner's token account must have been debited by deposit amount
        const actualDebit = ownerBalBefore - ownerBalAfter;
        chai_1.assert.equal(actualDebit.toString(), depositAmount.toString(), "owner token account should be debited by the deposit amount");
        // ── Print state for easy visual verification ──────────────
        console.log("\n  --- Before Deposit ---");
        console.log("  agent.balance       :", agentBefore.balance.toString(), "USDC lamports");
        console.log("  vault.totalDeposited:", vaultBefore.totalDeposited.toString(), "USDC lamports");
        console.log("  owner token balance :", ownerBalBefore.toString(), "USDC lamports");
        console.log("\n  --- After Deposit ---");
        console.log("  agent.balance       :", agentAfter.balance.toString(), "USDC lamports  (was 0, now 50 USDC)");
        console.log("  vault.totalDeposited:", vaultAfter.totalDeposited.toString(), "USDC lamports  (+50 USDC)");
        console.log("  agent token account :", agentTokenBal.toString(), "USDC lamports  (50 USDC on-chain)");
        console.log("  owner token balance :", ownerBalAfter.toString(), "USDC lamports  (was 100, now 50 USDC)");
        console.log("  owner debited by    :", actualDebit.toString(), "USDC lamports  (50 USDC)");
    });
});
