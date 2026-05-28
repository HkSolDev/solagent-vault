"use strict";
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
describe("solagent-vault", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.SolagentVault;
    const owner = provider.wallet;
    let vaultStatePda;
    before(async () => {
        // Derive the Vault State PDA from seeds: ["vault", owner pubkey]
        const [vPda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("vault"), owner.publicKey.toBuffer()], program.programId);
        vaultStatePda = vPda;
    });
    it("Initializes the master vault", async () => {
        await program.methods
            .initializeVault()
            .accountsStrict({
            vaultState: vaultStatePda,
            owner: owner.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
            .rpc();
        const vault = await program.account.vaultState.fetch(vaultStatePda);
        chai_1.assert.equal(vault.owner.toString(), owner.publicKey.toString());
        chai_1.assert.equal(vault.agentCount, 0);
        chai_1.assert.equal(vault.totalDeposited.toString(), "0");
        console.log("  Vault PDA     :", vaultStatePda.toString());
        console.log("  Vault Owner   :", vault.owner.toString());
        console.log("  Agent Count   :", vault.agentCount);
        console.log("  Total Deposited:", vault.totalDeposited.toString());
    });
});
