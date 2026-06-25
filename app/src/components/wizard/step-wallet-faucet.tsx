"use client";

import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import WizardStepLayout from "./wizard-step-layout";

interface StepWalletFaucetProps {
  connected: boolean;
  solBalance: number | null;
  loading: boolean;
  statusMsg: { text: string; isError: boolean } | null;
  onClaimAirdrop: () => Promise<void>;
  isActive: boolean;
  isCompleted: boolean;
  onToggle: () => void;
}

export default function StepWalletFaucet({
  connected,
  solBalance,
  loading,
  statusMsg,
  onClaimAirdrop,
  isActive,
  isCompleted,
  onToggle,
}: StepWalletFaucetProps) {
  return (
    <WizardStepLayout
      stepNumber={1}
      title="Wallet Setup & Devnet SOL Faucet"
      description="Connect your browser wallet and make sure you have enough SOL fee reserves on Devnet or Localnet."
      isActive={isActive}
      isCompleted={isCompleted}
      onToggle={onToggle}
    >
      <div className="flex flex-col gap-4 font-mono">
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          To run on-chain commands, you need a connected browser wallet (Phantom, Solflare, etc.) set to the correct cluster.
        </p>

        {/* Dynamic connection alert */}
        <div className="flex justify-center py-2 border-b border-primary/10">
          <WalletMultiButton className="!bg-primary-container hover:!brightness-110 !text-on-primary !font-mono !text-xs !h-10 !rounded-lg !border !border-primary/30 shadow-[0_0_16px_rgba(0,242,255,0.24)] transition-all" />
        </div>

        {connected ? (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Fee Reserves (SOL):</span>
              <span className={`font-bold ${solBalance && solBalance > 0.01 ? "text-vivid-cyan" : "text-amber-500 animate-pulse"}`}>
                {solBalance !== null ? `${solBalance.toFixed(4)} SOL` : "Querying balance..."}
              </span>
            </div>

            {solBalance !== null && solBalance < 0.05 && (
              <div className="text-[10px] text-amber-500 bg-amber-500/5 border border-amber-500/15 p-2 rounded">
                ⚠️ SOL reserves are low. Click claim below to request 1.0 free SOL on-chain.
              </div>
            )}

            <button
              onClick={onClaimAirdrop}
              disabled={loading}
              className={`w-full py-2.5 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                loading
                  ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                  : "bg-primary-container hover:brightness-110 text-on-primary border border-primary/25 shadow-[0_0_14px_rgba(0,242,255,0.22)]"
              }`}
            >
              {loading ? "Airdropping 1.0 SOL..." : "Claim 1.0 Devnet SOL 🪂"}
            </button>
          </div>
        ) : (
          <div className="p-3 text-center rounded border border-dashed border-glass-border/50 text-zinc-500 text-xs">
            🔒 Connect your browser wallet in the button above to unlock the sandbox setup.
          </div>
        )}

        {/* Transaction or Claim Logs */}
        {statusMsg && (
          <div
            className={`text-center text-[10px] p-2 rounded border leading-relaxed ${
              statusMsg.isError
                ? "bg-emergency-red/10 border-emergency-red/20 text-emergency-red"
                : "bg-success-emerald/10 border-success-emerald/20 text-success-emerald"
            }`}
          >
            {statusMsg.text}
          </div>
        )}
      </div>
    </WizardStepLayout>
  );
}
