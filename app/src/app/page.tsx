import React from "react";
import FaucetPanel from "@/components/faucet-panel";
import DashboardSimulator from "@/components/dashboard-simulator";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-electric-purple/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] aspect-square rounded-full bg-vivid-cyan/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-20 relative z-10">
        
        {/* Navigation Header mockup */}
        <header className="w-full max-w-6xl flex justify-between items-center mb-16 pb-6 border-b border-glass-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-electric-purple animate-pulse" />
            <span className="font-mono font-bold tracking-wider text-xl bg-gradient-to-r from-electric-purple to-vivid-cyan bg-clip-text text-transparent">
              SOLAGENT VAULT
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-xs font-mono px-3 py-1.5 rounded-full border border-glass-border bg-glass-card">
              Network: <span className="text-vivid-cyan">Surfpool Localnet</span>
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <main className="w-full max-w-6xl text-center flex flex-col items-center gap-6">
          <div className="inline-block text-xs font-mono tracking-widest text-electric-purple bg-electric-purple/15 border border-electric-purple/35 rounded-full px-4 py-1.5 mb-2">
            ON-CHAIN SECURITY GUARD FOR AI AGENTS
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-3xl">
            Secure Accounts with{" "}
            <span className="bg-gradient-to-r from-electric-purple to-vivid-cyan bg-clip-text text-transparent">
              On-Chain Policies
            </span>{" "}
            for AI Agents
          </h1>

          <p className="text-base md:text-xl text-zinc-400 max-w-2xl mt-2 leading-relaxed">
            Give your autonomous scripts and LLM agents limited wallets with strictly enforced, program-level guardrails. Prevent total drainage using rate limits and provider allowlists.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button className="px-8 py-3 rounded-md font-semibold bg-electric-purple hover:bg-electric-purple/90 text-white transition-all hover:scale-[1.02] shadow-lg shadow-electric-purple/20">
              Launch Developer Console
            </button>
            <button className="px-8 py-3 rounded-md font-semibold border border-glass-border bg-glass-card hover:bg-white/5 transition-all text-zinc-300">
              Read IDL Schema
            </button>
          </div>

          {/* Devnet Interactive Faucet Panel */}
          <FaucetPanel />

          {/* Real-time Dashboard Simulator Playground */}
          <DashboardSimulator />

          {/* Key Policy Highlights (Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-20">
            
            {/* Limit Card */}
            <div className="glass-panel p-6 rounded-xl text-left flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-electric-purple/15 flex items-center justify-center text-electric-purple font-mono font-bold">
                🎛️
              </div>
              <h3 className="text-lg font-bold text-white">Programmable Limits</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Configure exact transaction limits (`max_per_call`) and rolling 60-second rate limits (`max_per_minute`) that prevent accidental script loops from draining reserves.
              </p>
            </div>

            {/* Allowlist Card */}
            <div className="glass-panel p-6 rounded-xl text-left flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-vivid-cyan/15 flex items-center justify-center text-vivid-cyan font-mono font-bold">
                🎯
              </div>
              <h3 className="text-lg font-bold text-white">Provider Allowlists</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Restrict payouts exclusively to verified targets (e.g. OpenAI, DeepSeek, or RPC nodes). Hostile prompts cannot transfer funds to unverified accounts.
              </p>
            </div>

            {/* Panic Button Card */}
            <div className="glass-panel p-6 rounded-xl text-left flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-emergency-red/15 flex items-center justify-center text-emergency-red font-mono font-bold">
                🛑
              </div>
              <h3 className="text-lg font-bold text-white">Instant Panic Swings</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Vault administrators can instantly pause agent states on-chain, halting all spending attempts in real-time, even if the hot-key is compromised.
              </p>
            </div>

          </div>
        </main>

        <footer className="w-full max-w-6xl text-center text-xs text-zinc-500 font-mono mt-24 pt-6 border-t border-glass-border">
          SolAgent Vault • Program ID: C5pqn3tY...WzvRxr7o • Built for the Agentic Solana Economy
        </footer>

      </div>
    </div>
  );
}
