"use client";

import React, { useState } from "react";

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  llmProvider: "gemini" | "openrouter" | "ollama" | "mock" | "auto";
  onProviderSelect: (val: string) => void;
  apiKey: string;
  onApiKeyChange: (val: string) => void;
  modelName: string;
  onModelNameChange: (val: string) => void;
  merchantWallet: string;
  onMerchantWalletChange: (val: string) => void;
  spendAmount: string;
  setSpendAmount: (val: string) => void;
  onSubmit: () => Promise<void>;
  isBatch: boolean;
  targetAgentId: number;
}

export default function AiConfigModal({
  isOpen,
  onClose,
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
  onSubmit,
  isBatch,
  targetAgentId,
}: AiConfigModalProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStart = async () => {
    setSubmitting(true);
    try {
      await onSubmit();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040812]/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Card */}
      <div className="glass-panel p-5 rounded-2xl border border-primary/20 bg-surface-container/90 max-w-[560px] w-full flex flex-col gap-4 font-mono text-xs shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>🧠</span> {isBatch ? "BATCH FLEET AI SOLVER" : `CONFIGURE BRAIN: AGENT #${targetAgentId}`}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 font-bold text-sm focus:outline-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-[10px] text-zinc-400 leading-relaxed">
          {isBatch
            ? "Configure the cognitive settings to trigger live paywall spend solutions sequentially for ALL active fleet agents."
            : `Set the provider rules for Agent #${targetAgentId} to evaluate the merchant payment challenge and execute spends on-chain.`}
        </p>

        {/* Input fields */}
        <div className="flex flex-col gap-3.5 my-1">
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-widest">AI Cognitive Provider</label>
            <select
              value={llmProvider}
              onChange={(e) => onProviderSelect(e.target.value)}
              className="w-full bg-surface-container-low/80 border border-white/20 p-2.5 rounded-md text-xs text-white focus:outline-none focus:border-primary-container"
            >
              <option value="auto">Auto Route (random live provider from available keys)</option>
              <option value="mock">Simulated AI Agent (Mock / Offline)</option>
              <option value="openrouter">OpenRouter (Xiaomi Mimo/DeepSeek)</option>
              <option value="gemini">Google Gemini AI Studio</option>
              <option value="ollama">Local Ollama</option>
            </select>
          </div>

          {llmProvider !== "mock" && llmProvider !== "ollama" && llmProvider !== "auto" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-zinc-500 block uppercase tracking-widest">API Access Credentials</label>
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
                className="w-full bg-surface-container-low/80 border border-white/20 p-2.5 rounded-md text-xs text-white focus:outline-none focus:border-primary-container placeholder-zinc-600"
              />
              <span className="text-[8px] text-zinc-500 mt-1.5 block leading-normal font-sans">
                ℹ️ Optional: If left blank, the app securely falls back to your <code className="text-vivid-cyan bg-white/5 px-1 rounded">.env</code> keys.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-widest">Model Target</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => onModelNameChange(e.target.value)}
                className="w-full bg-surface-container-low/80 border border-white/20 p-2.5 rounded-md text-xs text-white focus:outline-none focus:border-primary-container"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-widest">Paywall Amount</label>
              <div className="flex items-center gap-1 bg-surface-container-low/80 border border-white/20 px-2 rounded-md">
                <input
                  type="text"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  className="w-full bg-transparent py-2 text-xs text-white focus:outline-none text-center"
                />
                <span className="text-[10px] text-zinc-400 font-bold">orbmarkets.io</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-widest">Merchant Destination Wallet</label>
            <input
              type="text"
              value={merchantWallet}
              onChange={(e) => onMerchantWalletChange(e.target.value)}
              className="w-full bg-surface-container-low/80 border border-white/20 p-2.5 rounded-md text-xs text-white focus:outline-none focus:border-primary-container select-all"
            />
          </div>
        </div>

        {/* Submit triggers */}
        <div className="flex gap-3 border-t border-white/10 pt-4 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-md bg-surface-container-low hover:bg-surface-container-high border border-white/20 font-bold text-zinc-300 transition-all cursor-pointer text-center"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleStart}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-md bg-primary-container hover:brightness-110 font-bold text-on-primary shadow-[0_0_20px_rgba(0,242,255,0.25)] transition-all cursor-pointer text-center disabled:opacity-50"
          >
            {submitting ? "Launching..." : isBatch ? "🚀 Launch All Solvers" : "🚀 Run AI Solver"}
          </button>
        </div>
      </div>
    </div>
  );
}
