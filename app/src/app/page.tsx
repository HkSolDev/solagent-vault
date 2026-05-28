"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
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
      
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-[-10%] left-[5%] w-[60%] aspect-square rounded-full bg-electric-purple/10 blur-[130px] pointer-events-none animate-glow-loop" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-vivid-cyan/8 blur-[120px] pointer-events-none animate-glow-loop" />
      
      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center px-6 py-8 relative z-10">
        
        {/* Navigation Header */}
        <header className="w-full max-w-6xl flex justify-between items-center mb-24 py-4 px-6 rounded-full glass-panel border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-electric-purple to-vivid-cyan animate-pulse" />
            <span className="font-mono font-bold tracking-widest text-lg bg-gradient-to-r from-electric-purple to-vivid-cyan bg-clip-text text-transparent">
              SOLAGENT VAULT
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 font-mono text-xs text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Core Features</a>
            <a href="#ecosystem" className="hover:text-white transition-colors">Ecosystem Mapping</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub Source</a>
          </nav>

          <div>
            <Link 
              href="/dashboard"
              className="text-xs font-mono px-4 py-2 rounded-full bg-electric-purple hover:bg-electric-purple/90 text-white font-bold transition-all shadow-glow-purple flex items-center gap-1.5 cursor-pointer"
            >
              <span>🚀</span> Launch Console
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="w-full max-w-6xl text-center flex flex-col items-center gap-8">
          
          {/* Startup badge */}
          <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-electric-purple bg-electric-purple/10 border border-electric-purple/20 rounded-full px-4.5 py-1.5 shadow-sm shadow-electric-purple/5">
            <span className="w-1.5 h-1.5 rounded-full bg-electric-purple animate-pulse" />
            ON-CHAIN SECURITY GUARD FOR AI AGENTS
          </div>
          
          {/* Hero text */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] max-w-4xl font-sans mt-2">
            Secure Web3 Wallets with{" "}
            <span className="bg-gradient-to-r from-electric-purple via-purple-400 to-vivid-cyan bg-clip-text text-transparent">
              Programmable Policies
            </span>{" "}
            for LLM Scripts
          </h1>

          <p className="text-sm sm:text-lg text-zinc-400 max-w-2xl mt-2 leading-relaxed font-mono">
            Give your autonomous LLM workflows, trading bots, and background scripts dedicated PDA accounts with strictly enforced limits. Prevent total wallet drainage from hostile prompt-injections on Solana.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-24">
            <Link 
              href="/dashboard"
              className="px-8 py-3.5 rounded-lg font-mono text-sm font-semibold bg-gradient-to-r from-electric-purple to-purple-600 hover:from-electric-purple/95 hover:to-purple-600/95 text-white transition-all hover:scale-[1.01] shadow-lg shadow-electric-purple/25 flex items-center gap-2 cursor-pointer"
            >
              <span>⚡</span> Launch Interactive Sandbox Console
            </Link>
            <a 
              href="#ecosystem" 
              className="px-8 py-3.5 rounded-lg font-mono text-sm font-semibold border border-glass-border bg-glass-card hover:bg-white/5 transition-all text-zinc-300 flex items-center gap-2 cursor-pointer"
            >
              <span>🔍</span> Ecosystem Benchmarks
            </a>
          </div>

          {/* Key Policy Highlights */}
          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl scroll-mt-24 mb-28">
            
            {/* Limit Card */}
            <div className="glass-panel p-8 rounded-2xl text-left flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-electric-purple/10 border border-electric-purple/15 flex items-center justify-center text-lg shadow-sm">
                🎛️
              </div>
              <h3 className="text-lg font-bold text-white font-mono tracking-tight">Enforced Rolling Limits</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                Configure static single-transaction size boundaries and rolling 60-second spending budgets directly inside Solana program instructions to neutralize fast loop errors.
              </p>
            </div>

            {/* Allowlist Card */}
            <div className="glass-panel p-8 rounded-2xl text-left flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-vivid-cyan/10 border border-vivid-cyan/15 flex items-center justify-center text-lg shadow-sm">
                🎯
              </div>
              <h3 className="text-lg font-bold text-white font-mono tracking-tight">Verified Target Allowlists</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                Restrict token and SOL payouts exclusively to whitelisted target accounts (like OpenAI, DeepSeek APIs, or compute instances). Hostile external addresses are auto-reverted on-chain.
              </p>
            </div>

            {/* Panic Button Card */}
            <div className="glass-panel p-8 rounded-2xl text-left flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-emergency-red/10 border border-emergency-red/15 flex items-center justify-center text-lg shadow-sm">
                🛑
              </div>
              <h3 className="text-lg font-bold text-white font-mono tracking-tight">Instant Panic Override</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                Administrator keyholders can trigger instant on-chain panic locks. If an LLM prompt is injected or a hot-key compromised, the wallet freezes in one block.
              </p>
            </div>

          </div>

          {/* Ecosystem Mapping Section */}
          <section id="ecosystem" className="w-full max-w-5xl scroll-mt-24 text-left flex flex-col gap-8 mb-20">
            <div className="border-l-2 border-electric-purple pl-4">
              <h2 className="text-2xl font-bold font-mono text-white tracking-tight uppercase">
                Solana AI Agent Security Landscape
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                How Solagent Vault aligns with and improves upon other open-source guardrail standards in the Solana ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              
              {/* Similar Project A: DCP */}
              <div className="glass-panel p-6 rounded-xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white">dcp</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">1lystore/dcp</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-2xl">
                    Focuses heavily on decentralized agent permission layers, human-in-the-loop triggers, and secure multi-wallet signing protocols.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-zinc-500 bg-white/[0.02] border border-white/5 rounded px-3 py-1 bg-black/40">
                  Focus: <span className="text-vivid-cyan">Signing & approvals</span>
                </div>
              </div>

              {/* Similar Project B: policyvault-solana */}
              <div className="glass-panel p-6 rounded-xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white">policyvault-solana</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">tolgaand/policyvault-solana</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-2xl">
                    Enforces strict, on-chain policy budgets, specific allowed target lists, cooldown timers, and a detailed audit log tracker.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-zinc-500 bg-white/[0.02] border border-white/5 rounded px-3 py-1 bg-black/40">
                  Focus: <span className="text-electric-purple">Allowlists & cooldowns</span>
                </div>
              </div>

              {/* Similar Project C: alexchenai/agent-vault */}
              <div className="glass-panel p-6 rounded-xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white">agent-vault</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">alexchenai/agent-vault</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-2xl">
                    Provides zero-drain MPC hotkey protection models allowing secure spend rules for agents competing in Synthesis cycles.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-zinc-500 bg-white/[0.02] border border-white/5 rounded px-3 py-1 bg-black/40">
                  Focus: <span className="text-amber-500">MPC Key Shields</span>
                </div>
              </div>

            </div>
          </section>

          {/* Prompt to try Sandbox */}
          <div className="glass-panel p-10 rounded-2xl w-full max-w-5xl border border-electric-purple/35 bg-electric-purple/[0.03] text-center flex flex-col items-center gap-4 relative overflow-hidden mb-12">
            <div className="absolute top-0 right-0 w-32 h-32 bg-electric-purple/10 blur-2xl pointer-events-none" />
            <h3 className="text-xl font-bold font-mono text-white">Test the Security Sandbox Live</h3>
            <p className="text-xs text-zinc-400 font-mono max-w-xl leading-relaxed">
              Launch our developer dashboard workspace to interact directly with an emulated Solana Surfnet validator, spawn mock agent keys, and trigger spending rules on-chain.
            </p>
            <Link 
              href="/dashboard"
              className="px-8 py-3 rounded bg-electric-purple hover:bg-electric-purple/90 text-white font-mono text-sm font-semibold transition-all shadow-glow-purple cursor-pointer mt-2"
            >
              Open Sandbox Workspace →
            </Link>
          </div>

        </main>

        {/* Footer */}
        <footer className="w-full max-w-6xl text-center text-[10px] text-zinc-500 font-mono mt-16 pt-8 border-t border-glass-border">
          SolAgent Vault • Built for secure autonomous transaction guardrails.
        </footer>

      </div>
    </div>
  );
}
