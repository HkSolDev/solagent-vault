"use client";

import React from "react";

interface VaultInitPanelProps {
  connected: boolean;
  vaultInitialized: boolean | null;
  actionLoading: boolean;
  loading: boolean;
  onInitVault: () => Promise<void>;
}

export default function VaultInitPanel({
  connected,
  vaultInitialized,
  actionLoading,
  loading,
  onInitVault,
}: VaultInitPanelProps) {
  if (!connected) {
    return (
      <div className="glass-panel p-8 rounded-xl text-center flex flex-col gap-3">
        <h3 className="text-xl font-bold text-white font-mono">1. Connect Your Wallet</h3>
        <p className="text-sm text-zinc-400">
          Please connect your devnet wallet in the playground widget above to manage spending policies.
        </p>
      </div>
    );
  }

  if (vaultInitialized === false) {
    return (
      <div className="glass-panel p-8 rounded-xl flex flex-col gap-4 border border-vivid-cyan/25">
        <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <span>🏗️</span> Step 1: Initialize On-Chain Vault
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed font-mono">
          Your wallet does not have a registered Vault State account yet. Click the button below to initialize your global spending vault on-chain.
        </p>
        <button
          onClick={onInitVault}
          disabled={actionLoading || loading}
          className="py-3 rounded bg-vivid-cyan text-black hover:bg-vivid-cyan/90 font-bold transition-all shadow-glow-cyan cursor-pointer disabled:opacity-50"
        >
          {actionLoading ? "Initializing Vault..." : "Initialize Vault State PDA"}
        </button>
      </div>
    );
  }

  return null;
}
