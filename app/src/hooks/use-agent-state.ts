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
  const MAX_AGENT_SCAN = 5000;
  const program = useAnchorProgram();
  const { publicKey, connected } = useWallet();

  const [vaultInitialized, setVaultInitialized] = useState<boolean | null>(null);
  const [agents, setAgents] = useState<OnChainAgent[]>([]);
  const [loading, setLoading] = useState(false);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const isRateLimitErr = (err: unknown) => {
    const msg = String((err as any)?.message || err || "").toLowerCase();
    return msg.includes("429") || msg.includes("rate limit");
  };

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
        // Discover all agent_state accounts owned by this wallet directly from chain.
        let allOwnedAgents: any[] = [];
        let lastErr: unknown = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            allOwnedAgents = await (program.account as any).agentState.all([
              {
                memcmp: {
                  // Account layout: 8 discriminator + 32 vault = 40 bytes, then owner pubkey starts.
                  offset: 40,
                  bytes: publicKey.toBase58(),
                },
              },
            ]);
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            if (!isRateLimitErr(err) || attempt === 2) throw err;
            await sleep(400 * (attempt + 1));
          }
        }

        const accountByPubkey = new Map<string, any>();
        for (const row of allOwnedAgents) {
          accountByPubkey.set(row.publicKey.toBase58(), row.account);
        }

        // Recover user-facing agent IDs by matching PDA derivations.
        const loadedAgents: OnChainAgent[] = [];
        let matched = 0;
        const targetMatches = accountByPubkey.size;

        for (let i = 1; i <= MAX_AGENT_SCAN && matched < targetMatches; i++) {
          const agentPda = getAgentPda(vaultPda, i);
          const key = agentPda.toBase58();
          const agentAcc = accountByPubkey.get(key);
          if (!agentAcc) continue;

          matched += 1;
          loadedAgents.push({
            id: i,
            publicKey: key,
            signer: agentAcc.agentSigner.toBase58(),
            balance: agentAcc.balance.toNumber() / 1_000_000, // 6 decimals token display
            maxPerCall: agentAcc.maxPerCall.toNumber() / 1_000_000,
            maxPerMinute: agentAcc.maxPerMinute.toNumber() / 1_000_000,
            status: agentAcc.status.active
              ? "Active"
              : agentAcc.status.paused
              ? "Paused"
              : "Drained",
            allowedProviders: agentAcc.allowedProviders
              .map((p: PublicKey) => p.toBase58())
              .filter((p: string) => p !== PublicKey.default.toBase58()),
          });
        }

        loadedAgents.sort((a, b) => a.id - b.id);
        setAgents(loadedAgents);
      }
    } catch (err) {
      console.error("Failed to load on-chain agent states", err);
      // Keep prior loaded list visible when RPC is temporarily rate-limited.
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
