"use client";

import { useState, useEffect, useCallback } from "react";
import { useAnchorProgram } from "./use-anchor-program";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export interface OnChainAgent {
  id: number;
  publicKey: string;
  signer: string;
  balance: number;
  maxPerCall: number;
  maxPerMinute: number;
  status: "Active" | "Paused" | "Drained";
  allowedProviders: string[];
}

export function useAgentState() {
  const program = useAnchorProgram();
  const { publicKey, connected } = useWallet();

  const [vaultInitialized, setVaultInitialized] = useState<boolean | null>(null);
  const [agents, setAgents] = useState<OnChainAgent[]>([]);
  const [loading, setLoading] = useState(false);

  // Derive VaultState PDA seed: ["vault", owner]
  const getVaultPda = useCallback((owner: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.toBuffer()],
      program.programId
    )[0];
  }, [program]);

  // Derive AgentState PDA seed: ["agent", vault, agent_id]
  const getAgentPda = useCallback((vault: PublicKey, id: number) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), vault.toBuffer(), new anchor.BN(id).toArrayLike(Buffer, "le", 8)],
      program.programId
    )[0];
  }, [program]);

  // Load vault configurations
  const loadVaultData = useCallback(async () => {
    if (!publicKey) {
      setVaultInitialized(false);
      setAgents([]);
      return;
    }

    setLoading(true);
    try {
      const vaultPda = getVaultPda(publicKey);
      
      // Try to fetch the vault state on-chain
      let vaultAccount = null;
      try {
        vaultAccount = await (program.account as any).vaultState.fetch(vaultPda);
        setVaultInitialized(true);
      } catch (err) {
        // Vault is not initialized yet on-chain for this wallet
        setVaultInitialized(false);
      }

      if (vaultAccount) {
        // Query registered agent state accounts (we fetch up to 3 for the demo playground)
        const loadedAgents: OnChainAgent[] = [];
        for (let i = 1; i <= 3; i++) {
          const agentPda = getAgentPda(vaultPda, i);
          try {
            const agentAcc: any = await (program.account as any).agentState.fetch(agentPda);
            loadedAgents.push({
              id: i,
              publicKey: agentPda.toBase58(),
              signer: agentAcc.agentSigner.toBase58(),
              balance: agentAcc.balance.toNumber() / 1_000_000, // 6 decimals USDC
              maxPerCall: agentAcc.maxPerCall.toNumber() / 1_000_000,
              maxPerMinute: agentAcc.maxPerMinute.toNumber() / 1_000_000,
              status: agentAcc.status.active ? "Active" : "Paused",
              allowedProviders: agentAcc.allowedProviders
                .map((p: PublicKey) => p.toBase58())
                .filter((p: string) => p !== PublicKey.default.toBase58()),
            });
          } catch (err) {
            // Agent ID doesn't exist yet on-chain
          }
        }
        setAgents(loadedAgents);
      }
    } catch (err) {
      console.error("Failed to load on-chain agent states", err);
    } finally {
      setLoading(false);
    }
  }, [publicKey, program, getVaultPda, getAgentPda]);

  // Trigger initialize vault instruction on-chain
  const initializeVault = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const vaultPda = getVaultPda(publicKey);
      await program.methods
        .initializeVault()
        .accounts({
          vaultState: vaultPda,
          owner: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      await loadVaultData();
    } catch (err) {
      console.error("Failed to initialize vault", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      loadVaultData();
    }
  }, [connected, publicKey, loadVaultData]);

  return {
    vaultInitialized,
    agents,
    loading,
    initializeVault,
    reload: loadVaultData,
  };
}
