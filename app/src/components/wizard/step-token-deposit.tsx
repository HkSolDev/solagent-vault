"use client";

import React from "react";
import WizardStepLayout from "./wizard-step-layout";

interface StepTokenDepositProps {
  usdcMintInput: string;
  setUsdcMintInput: (val: string) => void;
  actionLoading: boolean;
  onDeployCustomMint: () => Promise<void>;
  isActive: boolean;
  isCompleted: boolean;
  onToggle: () => void;
}

export default function StepTokenDeposit({
  usdcMintInput,
  setUsdcMintInput,
  actionLoading,
  onDeployCustomMint,
  isActive,
  isCompleted,
  onToggle,
}: StepTokenDepositProps) {
  return (
    <WizardStepLayout
      stepNumber={3}
      title="Custom Token Mint Setup"
      description="Deploy a custom orbmarkets.io token mint in one click to manage spending balances on-chain."
      isActive={isActive}
      isCompleted={isCompleted}
      onToggle={onToggle}
    >
      <div className="flex flex-col gap-4 font-mono text-xs">
        {/* Custom SPL Token Mint Deployer */}
        <div className="flex flex-col gap-2 p-3.5 rounded bg-surface-container-low/70 border border-primary/15">
          <label className="text-[10px] text-zinc-500 uppercase block">USDC / custom Token Mint Address</label>
          <div className="flex gap-2.5 mt-1">
            <input
              type="text"
              value={usdcMintInput}
              onChange={(e) => setUsdcMintInput(e.target.value)}
              className="flex-1 bg-surface-container-low/80 border border-primary/15 px-3 py-2 rounded text-white font-mono text-[11px] focus:outline-none focus:border-primary-container select-all"
              placeholder="Deploy a mint or enter an SPL token address"
            />
            <button
              onClick={onDeployCustomMint}
              disabled={actionLoading}
              className="px-4 py-2 rounded bg-primary-container hover:brightness-110 border border-primary/40 font-bold text-on-primary transition-all cursor-pointer disabled:opacity-50 text-[10px]"
            >
              🚀 Deploy Mint
            </button>
          </div>
          <span className="text-[9px] text-zinc-500 mt-1 block">
            💡 Click <strong>🚀 Deploy Mint</strong> to launch a fresh custom orbmarkets.io mint on-chain and fund your wallet with 1,000 tokens automatically.
          </span>
        </div>
      </div>
    </WizardStepLayout>
  );
}
