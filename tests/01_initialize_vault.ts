import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { SolagentVault } from "../target/types/solagent_vault";
import { assert } from "chai";

describe("solagent-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolagentVault as Program<SolagentVault>;
  const owner = provider.wallet as anchor.Wallet;

  let vaultStatePda: anchor.web3.PublicKey;

  before(async () => {
    // Derive the Vault State PDA from seeds: ["vault", owner pubkey]
    const [vPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.publicKey.toBuffer()],
      program.programId
    );
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

    assert.equal(vault.owner.toString(), owner.publicKey.toString());
    assert.equal(vault.agentCount, 0);
    assert.equal(vault.totalDeposited.toString(), "0");

    console.log("  Vault PDA     :", vaultStatePda.toString());
    console.log("  Vault Owner   :", vault.owner.toString());
    console.log("  Agent Count   :", vault.agentCount);
    console.log("  Total Deposited:", vault.totalDeposited.toString());
  });
});
