"use client";

import React from "react";
import WizardStepLayout from "./wizard-step-layout";

interface StepStressTestProps {
  spendAmount: string;
  setSpendAmount: (val: string) => void;
  actionLoading: boolean;
  onSpendTrigger: (mode: "normal" | "exploit-cap" | "exploit-rate" | "exploit-allowlist") => Promise<void>;
  isActive: boolean;
  isCompleted: boolean;
  onToggle: () => void;
}

export default function StepStressTest({
  spendAmount,
  setSpendAmount,
  actionLoading,
  onSpendTrigger,
  isActive,
  isCompleted,
  onToggle,
}: StepStressTestProps) {
  return (
    <WizardStepLayout
      stepNumber={5}
      title="Spending Policy Revert Stress-Tests"
      description="Deliberately try to breach boundaries to verify that the Solana smart contract automatically reverts malicious attempts."
      isActive={isActive}
      isCompleted={isCompleted}
      onToggle={onToggle}
    >
      <div className="flex flex-col gap-4 font-mono text-xs">
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Test the smart contract's security boundaries on-chain. Hammer the controls below to verify that the program prevents hacks instantly:
        </p>

        {/* Input to change amount for testing */}
        <div className="flex items-center gap-3 p-3 rounded bg-black/40 border border-glass-border/30">
          <span className="text-zinc-500 uppercase text-[10px]">Test Spend Amount:</span>
          <input
            value={spendAmount}
            onChange={(e) => setSpendAmount(e.target.value)}
            type="text"
            className="bg-white/5 border border-glass-border/50 px-3 py-1 rounded text-white font-mono max-w-[80px] text-center focus:outline-none"
          />
          <span className="text-zinc-400">Tokens</span>
        </div>

        {/* Trigger Exploit Revert Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => onSpendTrigger("normal")}
            disabled={actionLoading}
            className="py-2.5 px-3.5 rounded bg-zinc-800 hover:bg-zinc-700/80 font-mono text-[11px] text-left text-zinc-200 border border-glass-border transition-all flex justify-between cursor-pointer disabled:opacity-50"
          >
            <span>✅ Normal Spend Request</span>
            <span className="text-zinc-500 font-bold uppercase">Under Limits</span>
          </button>
          
          <button
            onClick={() => onSpendTrigger("exploit-cap")}
            disabled={actionLoading}
            className="py-2.5 px-3.5 rounded bg-emergency-red/10 hover:bg-emergency-red/20 font-mono text-[11px] text-left text-emergency-red border border-emergency-red/20 transition-all flex justify-between cursor-pointer disabled:opacity-50 animate-pulse"
          >
            <span>🚨 Exceed Max Single-Call Cap</span>
            <span className="text-emergency-red/70 font-bold uppercase">Should Revert</span>
          </button>

          <button
            onClick={() => onSpendTrigger("exploit-rate")}
            disabled={actionLoading}
            className="py-2.5 px-3.5 rounded bg-emergency-red/10 hover:bg-emergency-red/20 font-mono text-[11px] text-left text-emergency-red border border-emergency-red/20 transition-all flex justify-between cursor-pointer disabled:opacity-50"
          >
            <span>🚨 Hammer Minute Rate Limit</span>
            <span className="text-emergency-red/70 font-bold uppercase">Should Revert</span>
          </button>

          <button
            onClick={() => onSpendTrigger("exploit-allowlist")}
            disabled={actionLoading}
            className="py-2.5 px-3.5 rounded bg-emergency-red/10 hover:bg-emergency-red/20 font-mono text-[11px] text-left text-emergency-red border border-emergency-red/20 transition-all flex justify-between cursor-pointer disabled:opacity-50"
          >
            <span>🚨 Payout to Non-Allowlisted Target</span>
            <span className="text-emergency-red/70 font-bold uppercase">Should Revert</span>
          </button>
        </div>
      </div>
    </WizardStepLayout>
  );
}
