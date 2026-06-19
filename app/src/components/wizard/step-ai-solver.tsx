"use client";

import React, { useState } from "react";
import WizardStepLayout from "./wizard-step-layout";

interface StepAiSolverProps {
  llmProvider: "orchestrator" | "gemini" | "openrouter" | "ollama" | "mock" | "cerebras" | "mistral" | "kimi" | "deepseek" | "groq";
  onProviderSelect: (val: any) => void;
  apiKey: string;
  onApiKeyChange: (val: string) => void;
  cerebrasKey: string;
  onCerebrasKeyChange: (val: string) => void;
  geminiKey: string;
  onGeminiKeyChange: (val: string) => void;
  mistralKey: string;
  onMistralKeyChange: (val: string) => void;
  kimiKey: string;
  onKimiKeyChange: (val: string) => void;
  deepseekKey: string;
  onDeepseekKeyChange: (val: string) => void;
  openrouterKey: string;
  onOpenrouterKeyChange: (val: string) => void;
  groqKey: string;
  onGroqKeyChange: (val: string) => void;
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
  cerebrasKey,
  onCerebrasKeyChange,
  geminiKey,
  onGeminiKeyChange,
  mistralKey,
  onMistralKeyChange,
  kimiKey,
  onKimiKeyChange,
  deepseekKey,
  onDeepseekKeyChange,
  openrouterKey,
  onOpenrouterKeyChange,
  groqKey,
  onGroqKeyChange,
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
                  <option value="orchestrator">🧠 Smart Fallback Orchestrator (Free First)</option>
                  <option value="mock">Simulated AI Agent (Offline Mode)</option>
                  <option value="cerebras">Cerebras Llama3.1 (Free)</option>
                  <option value="gemini">Google Gemini Studio (Free)</option>
                  <option value="deepseek">DeepSeek API (Paid)</option>
                  <option value="groq">Groq API (Free Llama3)</option>
                  <option value="mistral">Mistral AI API (Paid)</option>
                  <option value="kimi">Kimi/Moonshot API (Paid)</option>
                  <option value="openrouter">OpenRouter API</option>
                  <option value="ollama">Local Ollama (Local Node)</option>
                </select>
              </div>

              {llmProvider === "orchestrator" ? (
                <div className="flex flex-col gap-2.5 p-2 rounded border border-glass-border/30 bg-black/40">
                  <span className="text-[9px] text-vivid-cyan font-bold uppercase tracking-wider block">Orchestrator Key Registry</span>
                  <div>
                    <label className="text-[8px] text-zinc-500 block mb-0.5">Cerebras Key (Free Path #1)</label>
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={cerebrasKey}
                      onChange={(e) => onCerebrasKeyChange(e.target.value)}
                      placeholder="Enter Cerebras API Key"
                      className="w-full bg-black/60 border border-glass-border p-1.5 rounded text-[10px] text-white focus:outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-zinc-500 block mb-0.5">Gemini Key (Free Path #2)</label>
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={geminiKey}
                      onChange={(e) => onGeminiKeyChange(e.target.value)}
                      placeholder="Enter Gemini API Key"
                      className="w-full bg-black/60 border border-glass-border p-1.5 rounded text-[10px] text-white focus:outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-zinc-500 block mb-0.5">OpenRouter Key (Free & Paid)</label>
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={openrouterKey}
                      onChange={(e) => onOpenrouterKeyChange(e.target.value)}
                      placeholder="Enter OpenRouter API Key"
                      className="w-full bg-black/60 border border-glass-border p-1.5 rounded text-[10px] text-white focus:outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-zinc-500 block mb-0.5">Groq Key (Free Path #3)</label>
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={groqKey}
                      onChange={(e) => onGroqKeyChange(e.target.value)}
                      placeholder="Enter Groq API Key"
                      className="w-full bg-black/60 border border-glass-border p-1.5 rounded text-[10px] text-white focus:outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-zinc-500 block mb-0.5">DeepSeek Key (Paid Path #1)</label>
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={deepseekKey}
                      onChange={(e) => onDeepseekKeyChange(e.target.value)}
                      placeholder="Enter DeepSeek API Key"
                      className="w-full bg-black/60 border border-glass-border p-1.5 rounded text-[10px] text-white focus:outline-none placeholder-zinc-700"
                    />
                  </div>
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[8px] text-zinc-500 hover:text-zinc-300"
                    >
                      {showApiKey ? "Hide Keys" : "Show Keys"}
                    </button>
                  </div>
                </div>
              ) : llmProvider !== "mock" && llmProvider !== "ollama" && (
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
                    value={
                      llmProvider === "gemini" ? geminiKey :
                      llmProvider === "cerebras" ? cerebrasKey :
                      llmProvider === "mistral" ? mistralKey :
                      llmProvider === "kimi" ? kimiKey :
                      llmProvider === "deepseek" ? deepseekKey :
                      llmProvider === "groq" ? groqKey :
                      openrouterKey
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (llmProvider === "gemini") onGeminiKeyChange(val);
                      else if (llmProvider === "cerebras") onCerebrasKeyChange(val);
                      else if (llmProvider === "mistral") onMistralKeyChange(val);
                      else if (llmProvider === "kimi") onKimiKeyChange(val);
                      else if (llmProvider === "deepseek") onDeepseekKeyChange(val);
                      else if (llmProvider === "groq") onGroqKeyChange(val);
                      else onOpenrouterKeyChange(val);
                    }}
                    placeholder={`Enter your ${llmProvider.toUpperCase()} API Key`}
                    className="w-full bg-black/40 border border-glass-border p-2 rounded text-xs text-white focus:outline-none placeholder-zinc-700"
                  />
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
                <span>🚀</span> {solverState === "querying" ? "AI RESOLVING..." : solverState === "signing" ? "SIGNING..." : `LAUNCH AI AGENT #${activeAgentId}`}
              </button>
              
              <button
                onClick={onStartDemo}
                disabled={actionLoading}
                className="px-5 py-3 rounded border border-glass-border bg-glass-card hover:bg-white/5 font-bold text-[11px] text-zinc-300 transition-all cursor-pointer disabled:opacity-50"
              >
                🎥 1-Click Autopilot
              </button>
            </div>
          )}
        </div>

        {/* Solver Diagnostics feedback panel */}
        {solverState !== "idle" && (
          <div className="p-3 border border-glass-border/30 bg-black/45 rounded flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-zinc-500">STATE STATUS:</span>
              <span className={`font-bold capitalize ${
                solverState === "done" ? "text-success-emerald" :
                solverState === "error" ? "text-emergency-red" : "text-amber-500 animate-pulse"
              }`}>{solverState}</span>
            </div>

            {solverState === "error" && solverErrorMsg && (
              <div className="text-[10px] text-emergency-red p-2 bg-emergency-red/10 border border-emergency-red/20 rounded font-mono break-all leading-normal">
                {solverErrorMsg}
              </div>
            )}

            {solverState === "done" && confirmedTxSignature && (
              <div className="flex flex-col gap-1 text-[10px] p-2 bg-success-emerald/10 border border-success-emerald/20 rounded font-mono leading-normal">
                <span className="text-success-emerald font-bold">🎉 Authorization Completed!</span>
                <a
                  href={`https://explorer.solana.com/tx/${confirmedTxSignature}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-vivid-cyan hover:underline break-all mt-1 block"
                >
                  🔗 View Tx: {confirmedTxSignature.substring(0, 32)}...
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </WizardStepLayout>
  );
}
