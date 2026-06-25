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
  simulationMode: boolean;
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
  simulationMode,
  isActive,
  isCompleted,
  onToggle,
}: StepAgentPdaProps) {
  const providerPresets = [
    { label: "Open Access (No Allowlist)", value: "" },
    { label: "OpenAI Billing", value: "F5FjAAU6y22eUisRo1dzm5L6ENB4XTNMUGxJrYKsUBvY" },
    { label: "Anthropic Billing", value: "8VvtM3re4KSbYEHDRdGFXhqGFKp2x1xvnLcTH3ab7Tbo" },
    { label: "DeepSeek Billing", value: "GpvVtiiuSuLidfbpcmJiUumF2NEnp2DSTN3moopVSRPF" },
  ];

  const applyPreset = (kind: "conservative" | "balanced" | "aggressive") => {
    if (kind === "conservative") {
      setMaxCallInput("2.5");
      setMaxMinuteInput("7.5");
      return;
    }
    if (kind === "balanced") {
      setMaxCallInput("5.0");
      setMaxMinuteInput("15.0");
      return;
    }
    setMaxCallInput("10.0");
    setMaxMinuteInput("35.0");
  };

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
        {vaultInitialized !== true ? (
          /* Sub-step: Initializing Master Registry PDA */
          <div className="flex flex-col gap-3">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {vaultInitialized === false
                ? "Your wallet does not have an initialized Program Vault Registry on-chain. Before registering agents, deploy this master state PDA."
                : "Checking vault registry state for this wallet. If this is your first run on this wallet/network, deploy the Program Vault Registry first."}
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
                  className="bg-surface-container-low/80 border border-primary/15 px-3 py-2 rounded text-white font-mono focus:outline-none focus:border-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase">Seeded SOL Fee budget</label>
                <input
                  value={solSeedInput}
                  onChange={(e) => setSolSeedInput(e.target.value)}
                  type="text"
                  className="bg-surface-container-low/80 border border-primary/15 px-3 py-2 rounded text-white font-mono focus:outline-none focus:border-primary-container"
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
                  className="bg-surface-container-low/80 border border-primary/15 px-3 py-2 rounded text-white font-mono focus:outline-none focus:border-primary-container"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-500 uppercase">Per-Minute Rate ($ USDC)</label>
                <input
                  value={maxMinuteInput}
                  onChange={(e) => setMaxMinuteInput(e.target.value)}
                  type="text"
                  className="bg-surface-container-low/80 border border-primary/15 px-3 py-2 rounded text-white font-mono focus:outline-none focus:border-primary-container"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 uppercase">Policy Presets</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset("conservative")}
                  className="py-1.5 rounded border border-amber-400/30 bg-amber-400/10 text-amber-200 font-bold text-[10px] hover:bg-amber-400/20 transition-all cursor-pointer"
                >
                  Conservative
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("balanced")}
                  className="py-1.5 rounded border border-primary/40 bg-primary/10 text-primary font-bold text-[10px] hover:bg-primary/20 transition-all cursor-pointer"
                >
                  Balanced
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("aggressive")}
                  className="py-1.5 rounded border border-tertiary/40 bg-tertiary/10 text-tertiary font-bold text-[10px] hover:bg-tertiary/20 transition-all cursor-pointer"
                >
                  Aggressive
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase">Allowed Provider Wallet (Optional)</label>
              <select
                value={allowedProviderInput}
                onChange={(e) => setAllowedProviderInput(e.target.value)}
                className="bg-surface-container-low/80 border border-primary/15 px-3 py-2 rounded text-white font-mono focus:outline-none focus:border-primary-container mb-2"
              >
                {providerPresets.map((preset) => (
                  <option key={preset.label} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <input
                value={allowedProviderInput}
                onChange={(e) => setAllowedProviderInput(e.target.value)}
                placeholder="e.g. OpenAI billing destination address"
                type="text"
                className="bg-surface-container-low/80 border border-primary/15 px-3 py-2 rounded text-white font-mono focus:outline-none focus:border-primary-container"
              />
            </div>

            <button
              onClick={onRegisterAgent}
              disabled={actionLoading}
              className="py-2.5 rounded bg-primary-container hover:brightness-110 text-on-primary font-bold transition-all shadow-[0_0_16px_rgba(0,242,255,0.24)] cursor-pointer disabled:opacity-50 mt-1"
            >
              {actionLoading ? "Registering Agent PDA..." : "Spawn secure Agent PDA on-chain"}
            </button>
            <p className={`text-[10px] ${simulationMode ? "text-amber-300" : "text-emerald-300"}`}>
              {simulationMode
                ? "Simulation Mode active: failed follow-up actions may use simulated confirmations."
                : "Real Mode active: on-chain failures are hard-blocked with no simulated success fallback."}
            </p>
          </div>
        )}
      </div>
    </WizardStepLayout>
  );
}
