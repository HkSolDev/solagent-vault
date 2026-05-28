"use client";

import React, { useState, useEffect } from "react";
import FaucetPanel from "@/components/faucet-panel";
import DashboardSimulator from "@/components/dashboard-simulator";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-[#030307] text-[#f4f4f5] justify-center items-center">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Dynamic atmospheric backdrops */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full bg-electric-purple/10 blur-[130px] pointer-events-none animate-glow-loop" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-vivid-cyan/8 blur-[120px] pointer-events-none animate-glow-loop" />

      <div className="flex-1 flex flex-col items-center px-6 py-8 relative z-10">
        {/* Dashboard Workspace Header */}
        <header className="w-full max-w-6xl flex justify-between items-center mb-10 py-4 px-6 rounded-full glass-panel border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-electric-purple to-vivid-cyan animate-pulse" />
              <span className="font-mono font-bold tracking-widest text-base text-white">
                SOLAGENT VAULT
              </span>
            </a>
            <span className="h-4 w-px bg-zinc-700" />
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/60 px-2.5 py-0.5 rounded uppercase border border-zinc-700/50">
              Dev Sandbox
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-glass-border bg-black/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-vivid-cyan animate-ping" />
              RPC: <span className="text-vivid-cyan font-bold">Surfpool Active</span>
            </span>
            <a 
              href="/"
              className="text-xs font-mono px-4 py-1.5 rounded-md border border-glass-border bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              ← Product Info
            </a>
          </div>
        </header>

        {/* Dashboard Core Content Workspace */}
        <div className="w-full max-w-6xl flex flex-col gap-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-glass-border pb-6">
            <div>
              <h1 className="text-2xl font-extrabold font-mono tracking-tight text-white flex items-center gap-2">
                <span>⚡</span> PROGRAMMABLE SECURITY WORKSPACE
              </h1>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Configure isolated PDA accounts, seed simulated hot-keys, and stress-test on-chain policy revert guards.
              </p>
            </div>
            
            <div className="flex gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#0a0a14] border border-glass-border text-zinc-400">
                Network: <span className="text-electric-purple font-bold">Localnet</span>
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#0a0a14] border border-glass-border text-zinc-400">
                Program: <span className="text-zinc-300 font-bold select-all">C5pq...xr7o</span>
              </span>
            </div>
          </div>

          {/* Interactive balance faucet utility */}
          <div className="w-full">
            <FaucetPanel />
          </div>

          {/* Main dashboard rules controller simulator */}
          <div className="w-full">
            <DashboardSimulator />
          </div>

        </div>

        {/* Footer */}
        <footer className="w-full max-w-6xl text-center text-[10px] text-zinc-500 font-mono mt-20 pt-8 border-t border-glass-border">
          SolAgent Vault Dashboard • Powered by automated local Surfpool validator nodes.
        </footer>
      </div>
    </div>
  );
}
