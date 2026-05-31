"use client";

import React from "react";
import WizardStepLayout from "./wizard-step-layout";

interface StepAgentPdaProps {
  vaultInitialized: boolean | null;
  agentsCount: number;
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
  onInitVault: () => Promise<void>;
  onRegisterAgent: () => Promise<void>;
  isActive: boolean;
  isCompleted: boolean;
  onToggle: () => void;
}

export default function StepAgentPda({
  vaultInitialized,
  agentsCount,
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
  onInitVault,
  onRegisterAgent,
  isActive,
  isCompleted,
  onToggle,
}: StepAgentPdaProps) {
  return (
    <WizardStepLayout
      stepNumber={2}
      title="Program Registry & AI Agent PDA"
      description="Initialize your master registry and deploy an isolated spending policy PDA for your AI script."
      isActive={isActive}
      isCompleted={isCompleted}
      onToggle={onToggle}
    >
      <div className="flex flex-col gap-4 font-mono text-xs">
        {vaultInitialized === false ? (
          /* Sub-step: Initializing Master Registry PDA */
          <div className="flex flex-col gap-3">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Your wallet does not have an initialized **Program Vault Registry** on-chain. Before registering agents, you must deploy this master state PDA.
            </p>
            <button
              onClick={onInitVault}
              disabled={actionLoading}
              className="w-full py-3 rounded bg-electric-purple hover:bg-electric-purple/90 font-bold text-white transition-all shadow-glow-purple cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? "Initializing Registry PDA..." : "⚡ Deploy Global Program Registry"}
            </button>
          </div>
        ) : (
          /* Sub-step: Registering New AI Agent Policy */
          <div className="flex flex-col gap-4">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Global Registry is active! Spawn an isolated, on-chain Associated Spending Account PDA for a delegated AI hot-key:
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase">Agent ID (Numeric)</label>
                <input
                  value={agentIdInput}
                  onChange={(e) => setAgentIdInput(e.target.value)}
                  type="number"
                  className="bg-white/5 border border-glass-border px-3 py-2 rounded text-white font-mono focus:outline-none focus:border-electric-purple"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase">Seeded SOL Fee budget</label>
                <input
                  value={solSeedInput}
                  onChange={(e) => setSolSeedInput(e.target.value)}
                  type="text"
                  className="bg-white/5 border border-glass-border px-3 py-2 rounded text-white font-mono focus:outline-none focus:border-electric-purple"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase">Single-Call Cap ($ USDC)</label>
                <input
                  value={maxCallInput}
                  onChange={(e) => setMaxCallInput(e.target.value)}
                  type="text"
                  className="bg-white/5 border border-glass-border px-3 py-2 rounded text-white font-mono focus:outline-none focus:border-electric-purple"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase">Per-Minute Rate ($ USDC)</label>
                <input
                  value={maxMinuteInput}
                  onChange={(e) => setMaxMinuteInput(e.target.value)}
                  type="text"
                  className="bg-white/5 border border-glass-border px-3 py-2 rounded text-white font-mono focus:outline-none focus:border-electric-purple"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase">Allowed Provider Wallet (Optional)</label>
              <input
                value={allowedProviderInput}
                onChange={(e) => setAllowedProviderInput(e.target.value)}
                placeholder="e.g. OpenAI billing destination address"
                type="text"
                className="bg-white/5 border border-glass-border px-3 py-2 rounded text-white font-mono focus:outline-none focus:border-electric-purple"
              />
            </div>

            <button
              onClick={onRegisterAgent}
              disabled={actionLoading}
              className="py-2.5 rounded bg-electric-purple hover:bg-electric-purple/90 text-white font-bold transition-all shadow-glow-purple cursor-pointer disabled:opacity-50 mt-1"
            >
              {actionLoading ? "Registering Agent PDA..." : "Spawn secure Agent PDA on-chain"}
            </button>
          </div>
        )}
      </div>
    </WizardStepLayout>
  );
}
