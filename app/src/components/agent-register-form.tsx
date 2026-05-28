"use client";

import React from "react";

interface AgentRegisterFormProps {
  agentIdInput: string;
  setAgentIdInput: (val: string) => void;
  solSeedInput: string;
  setSolSeedInput: (val: string) => void;
  maxCallInput: string;
  setMaxCallInput: (val: string) => void;
  maxMinuteInput: string;
  setMaxMinuteInput: (val: string) => void;
  allowedProviderInput: string;
  setAllowedProviderInput: (val: string) => void;
  actionLoading: boolean;
  onRegisterAgent: () => Promise<void>;
}

export default function AgentRegisterForm({
  agentIdInput,
  setAgentIdInput,
  solSeedInput,
  setSolSeedInput,
  maxCallInput,
  setMaxCallInput,
  maxMinuteInput,
  setMaxMinuteInput,
  allowedProviderInput,
  setAllowedProviderInput,
  actionLoading,
  onRegisterAgent,
}: AgentRegisterFormProps) {
  return (
    <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
      <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
        <span>🤖</span> Register Delegated Agent PDA
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400">Agent ID (Numeric)</label>
          <input
            value={agentIdInput}
            onChange={(e) => setAgentIdInput(e.target.value)}
            type="number"
            className="bg-white/5 border border-glass-border px-3 py-2 rounded text-sm text-white font-mono focus:outline-none focus:border-electric-purple"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400">SOL Seed fee allocation</label>
          <input
            value={solSeedInput}
            onChange={(e) => setSolSeedInput(e.target.value)}
            type="text"
            className="bg-white/5 border border-glass-border px-3 py-2 rounded text-sm text-white font-mono focus:outline-none focus:border-electric-purple"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400">Single-Call Cap ($ USDC)</label>
          <input
            value={maxCallInput}
            onChange={(e) => setMaxCallInput(e.target.value)}
            type="text"
            className="bg-white/5 border border-glass-border px-3 py-2 rounded text-sm text-white font-mono focus:outline-none focus:border-electric-purple"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400">Per-Minute Rate ($ USDC)</label>
          <input
            value={maxMinuteInput}
            onChange={(e) => setMaxMinuteInput(e.target.value)}
            type="text"
            className="bg-white/5 border border-glass-border px-3 py-2 rounded text-sm text-white font-mono focus:outline-none focus:border-electric-purple"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-mono uppercase text-zinc-400">Allowed Provider Wallet (Optional)</label>
        <input
          value={allowedProviderInput}
          onChange={(e) => setAllowedProviderInput(e.target.value)}
          placeholder="e.g. OpenAI Gateway address"
          type="text"
          className="bg-white/5 border border-glass-border px-3 py-2 rounded text-sm text-white font-mono focus:outline-none focus:border-electric-purple"
        />
      </div>

      <button
        onClick={onRegisterAgent}
        disabled={actionLoading}
        className="py-2.5 rounded bg-electric-purple hover:bg-electric-purple/90 text-white font-bold transition-all mt-2 shadow-glow-purple cursor-pointer disabled:opacity-50"
      >
        {actionLoading ? "Registering on-chain..." : "Spawn Agent on Devnet"}
      </button>
    </div>
  );
}
