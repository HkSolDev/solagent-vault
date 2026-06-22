"use client";

import React, { useState } from "react";
import WizardStepLayout from "./wizard-step-layout";

interface StepAiSolverProps {
  llmProvider: "gemini" | "openrouter" | "ollama" | "mock";
  onProviderSelect: (val: string) => void;
  apiKey: string;
  onApiKeyChange: (val: string) => void;
  modelName: string;
  onModelNameChange: (val: string) => void;
  merchantWallet: string;
  onMerchantWalletChange: (val: string) => void;
  spendAmount: string;
  setSpendAmount: (val: string) => void;
  solverState: "idle" | "fetching" | "querying" | "signing" | "done" | "error";
  solverErrorMsg: string;
  confirmedTxSignature: string;
  onLiveAISolve: () => Promise<void>;
  autoRunning: boolean;
  currentStep: string;
  stepPercent: number;
  onStartDemo: () => Promise<void>;
  actionLoading: boolean;
  isActive: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  activeAgentId: number;
  usdcMint: string;
}

export default function StepAiSolver({
  llmProvider,
  onProviderSelect,
  apiKey,
  onApiKeyChange,
  modelName,
  onModelNameChange,
  merchantWallet,
  onMerchantWalletChange,
  spendAmount,
  setSpendAmount,
  solverState,
  solverErrorMsg,
  confirmedTxSignature,
  onLiveAISolve,
  autoRunning,
  currentStep,
  stepPercent,
  onStartDemo,
  actionLoading,
  isActive,
  isCompleted,
  onToggle,
  activeAgentId,
  usdcMint,
}: StepAiSolverProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <WizardStepLayout
      stepNumber={4}
      title="Live AI Autopilot & Solver"
      description="Trigger the Live AI Solver to capture and process a merchant paywall challenge, or run the 1-click Autopilot demo."
      isActive={isActive}
      isCompleted={isCompleted}
      onToggle={onToggle}
    >
      <div className="flex flex-col gap-4 font-mono text-xs">
        {/* Toggleable Advanced Configuration Accordion */}
        <div className="border border-glass-border/30 rounded bg-black/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="w-full px-3 py-2 flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400 hover:bg-white/[0.02]"
          >
            <span>⚙️ Advanced LLM & Merchant Settings</span>
            <span className="text-[8px]">{showConfig ? "Collapse ▲" : "Expand ▼"}</span>
          </button>

          {showConfig && (
            <div className="p-3.5 flex flex-col gap-3.5 border-t border-glass-border/30 bg-black/25">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">AI Cognitive Provider</label>
                <select
                  value={llmProvider}
                  onChange={(e) => onProviderSelect(e.target.value)}
                  className="w-full bg-black/40 border border-glass-border p-2 rounded text-xs text-white focus:outline-none"
                >
                  <option value="mock">Simulated AI Agent (Offline Mode)</option>
                  <option value="openrouter">OpenRouter (Xiaomi Mimo/DeepSeek)</option>
                  <option value="gemini">Google Gemini AI Studio</option>
                  <option value="ollama">Local Ollama (Local Node)</option>
                </select>
              </div>

              {llmProvider !== "mock" && llmProvider !== "ollama" && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-zinc-500 block">API Access Credentials</label>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[9px] text-zinc-500 hover:text-zinc-300"
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    placeholder={`Enter your ${llmProvider === "gemini" ? "Gemini" : "OpenRouter"} API Key`}
                    className="w-full bg-black/40 border border-glass-border p-2 rounded text-xs text-white focus:outline-none placeholder-zinc-700"
                  />
                  <span className="text-[8px] text-zinc-500 mt-1.5 block leading-normal font-sans">
                    ℹ️ Optional: If left blank, the app securely falls back to your <code className="text-vivid-cyan bg-white/5 px-1 rounded">.env</code> keys.
                  </span>
                </div>
              )}

              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Model Name</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => onModelNameChange(e.target.value)}
                  className="w-full bg-black/40 border border-glass-border p-2 rounded text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Simulated Merchant Destination Wallet</label>
                <input
                  type="text"
                  value={merchantWallet}
                  onChange={(e) => onMerchantWalletChange(e.target.value)}
                  className="w-full bg-black/40 border border-glass-border p-2 rounded text-xs text-white focus:outline-none select-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Live solver control options */}
        <div className="flex flex-col gap-3 p-3.5 rounded bg-black/35 border border-glass-border/30">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-zinc-500">PROVIDER ACTIVE:</span>
            <span className="text-vivid-cyan font-bold">{llmProvider.toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-zinc-500">PAYWALL ATTEMPT:</span>
            <span className="text-zinc-300 font-bold">${spendAmount} Tokens</span>
          </div>

          <div className="h-px bg-glass-border/30 my-1" />

          {autoRunning ? (
            /* Autopilot Demo progress indicator */
            <div className="flex flex-col gap-2 py-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-300 animate-pulse">{currentStep}</span>
                <span className="text-electric-purple font-bold">{stepPercent}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-glass-border">
                <div
                  className="bg-gradient-to-r from-electric-purple to-vivid-cyan h-full transition-all duration-500 shadow-glow-purple"
                  style={{ width: `${stepPercent}%` }}
                />
              </div>
            </div>
          ) : (
            /* Interaction buttons */
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={onLiveAISolve}
                disabled={solverState !== "idle" && solverState !== "done" && solverState !== "error"}
                className="flex-1 py-3 rounded bg-gradient-to-r from-electric-purple to-purple-600 hover:opacity-90 font-bold text-[11px] text-white shadow-glow-purple flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {solverState === "idle" && <span>🤖 Run Live AI Solver</span>}
                {solverState === "fetching" && <span>📥 Fetching challenge...</span>}
                {solverState === "querying" && <span>🧠 Thinking...</span>}
                {solverState === "signing" && <span>⚙️ Executing Tx...</span>}
                {solverState === "done" && <span>✓ Live Solved! Run again</span>}
                {solverState === "error" && <span>❌ Solver Error! Retry</span>}
              </button>

              <button
                onClick={onStartDemo}
                disabled={actionLoading}
                className="py-3 px-4 rounded bg-zinc-800 hover:bg-zinc-700 border border-glass-border font-bold text-[11px] text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>✨ Autopilot Demo</span>
              </button>
            </div>
          )}

          {/* Explorer details output card */}
          {solverState === "done" && confirmedTxSignature && (
            <div className="p-3 rounded border border-success-emerald/30 bg-success-emerald/5 flex flex-col gap-1 mt-2">
              <div className="text-[10px] font-bold text-success-emerald flex items-center gap-1.5">
                <span>🎉</span> SPENDING BUDGET RELEASED ON-CHAIN
              </div>
              <div className="text-[9px] text-zinc-500 truncate">
                Signature: {confirmedTxSignature}
              </div>
               <a
                href={(() => {
                  const activeNetwork = typeof window !== "undefined" ? localStorage.getItem("solagent_network") : "devnet";
                  const clusterParam = activeNetwork === "localnet"
                    ? "cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899"
                    : "cluster=devnet";
                  return confirmedTxSignature.endsWith("F5FjAA")
                    ? `https://explorer.solana.com/address/${merchantWallet}?${clusterParam}`
                    : `https://explorer.solana.com/tx/${confirmedTxSignature}?${clusterParam}`;
                })()}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-vivid-cyan hover:underline flex items-center gap-1 mt-1 font-bold"
              >
                🔍 Verify live transaction details on Solana Explorer →
              </a>
            </div>
          )}

          {solverState === "error" && solverErrorMsg && (
            <div className="p-2.5 rounded border border-emergency-red/30 bg-emergency-red/5 text-[9px] text-emergency-red mt-2 leading-relaxed">
              <strong>Solver Interception Error:</strong> {solverErrorMsg}
            </div>
          )}
        </div>
      </div>
    </WizardStepLayout>
  );
}
