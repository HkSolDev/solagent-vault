"use client";

import React from "react";

interface AutopilotPanelProps {
  autoRunning: boolean;
  currentStep: string;
  stepPercent: number;
  onStartDemo: () => Promise<void>;
  actionLoading: boolean;
}

export default function AutopilotPanel({
  autoRunning,
  currentStep,
  stepPercent,
  onStartDemo,
  actionLoading,
}: AutopilotPanelProps) {
  return (
    <div className="glass-panel p-6 rounded-xl border border-electric-purple/30 bg-electric-purple/5 flex flex-col gap-4 relative overflow-hidden">
      {/* Subtle neon glow inside card background */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-electric-purple/10 blur-xl pointer-events-none" />
      
      <div className="flex justify-between items-center relative z-10">
        <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
          <span className="text-electric-purple">✨</span> ONE-CLICK AI VAULT DEMO
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-electric-purple/35 bg-electric-purple/10 text-electric-purple">
          Presentation Autopilot
        </span>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed font-mono relative z-10">
        Confused on how to start? Sit back and click play. The autopilot will automatically seed keys, request faucet SOL, initialize the vault PDA, register Agent #1, fund USDC, and execute standard API spends and malicious hack overrides live!
      </p>

      {autoRunning ? (
        <div className="flex flex-col gap-2 mt-2 relative z-10">
          <div className="flex justify-between text-xs font-mono text-zinc-300">
            <span>{currentStep}</span>
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
        <button
          onClick={onStartDemo}
          disabled={actionLoading}
          className="py-3 px-4 rounded bg-electric-purple hover:bg-electric-purple/90 text-white font-bold font-mono text-sm transition-all shadow-glow-purple hover:scale-[1.01] mt-1 relative z-10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>🚀</span> Start Autonomous Security Playback
        </button>
      )}
    </div>
  );
}
