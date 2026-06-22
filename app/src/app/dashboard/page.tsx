"use client";

import React, { useState, useEffect } from "react";
import DashboardSimulator from "@/components/dashboard-simulator";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [network, setNetwork] = useState<"devnet" | "localnet">("devnet");
  const [customRpc, setCustomRpc] = useState("");
  const [showRpcInput, setShowRpcInput] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("solagent_network");
      if (saved === "localnet") {
        setNetwork("localnet");
      } else {
        setNetwork("devnet");
      }
      setCustomRpc(localStorage.getItem("solagent_custom_rpc") || "");
    }
  }, []);

  const handleNetworkToggle = () => {
    const nextNetwork = network === "devnet" ? "localnet" : "devnet";
    localStorage.setItem("solagent_network", nextNetwork);
    window.location.reload();
  };

  const handleSaveCustomRpc = (url: string) => {
    localStorage.setItem("solagent_custom_rpc", url);
    window.location.reload();
  };

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
            {/* Interactive Network Switcher Dropdown */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleNetworkToggle}
                title="Click to toggle between Devnet and Localnet"
                className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-glass-border bg-black/40 hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer text-zinc-300"
              >
                <span className={`w-1.5 h-1.5 rounded-full animate-ping ${
                  network === "devnet" ? "bg-success-emerald" : "bg-vivid-cyan"
                }`} />
                RPC: <span className={
                  network === "devnet" ? "text-success-emerald font-bold" : "text-vivid-cyan font-bold"
                }>
                  {network === "devnet" ? (customRpc ? "Custom Devnet" : "Solana Devnet") : "Surfpool Localnet"}
                </span>
                <span className="text-[8px] text-zinc-500 font-bold ml-1 uppercase">(Toggle)</span>
              </button>

              {network === "devnet" && (
                <div className="relative flex items-center">
                  <button
                    onClick={() => setShowRpcInput(!showRpcInput)}
                    title="Configure Custom RPC URL"
                    className="p-1.5 rounded-full border border-glass-border bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer text-[10px]"
                  >
                    ⚙️
                  </button>
                  {showRpcInput && (
                    <div className="absolute right-0 top-8 z-50 p-3 rounded-lg border border-glass-border bg-zinc-950/95 shadow-2xl flex flex-col gap-2 w-72">
                      <div className="text-[9px] font-bold text-zinc-300 uppercase">Custom Devnet RPC URL</div>
                      <input
                        type="text"
                        placeholder="https://devnet.helius-rpc.com/?api-key=..."
                        value={customRpc}
                        onChange={(e) => setCustomRpc(e.target.value)}
                        className="w-full text-[10px] px-2 py-1 rounded bg-black border border-glass-border text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => {
                            setCustomRpc("");
                            handleSaveCustomRpc("");
                          }}
                          className="text-[9px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => handleSaveCustomRpc(customRpc)}
                          className="text-[9px] px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold"
                        >
                          Save & Reload
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
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
                Network: <span className="text-electric-purple font-bold uppercase">{network}</span>
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#0a0a14] border border-glass-border text-zinc-400">
                Program: <span className="text-zinc-300 font-bold select-all">C5pq...xr7o</span>
              </span>
            </div>
          </div>

          {/* Main dashboard rules controller simulator containing the 5-Step Wizard & Live Diagnostics */}
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
