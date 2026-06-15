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
      
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[5%] w-[60%] aspect-square rounded-full bg-electric-purple/10 blur-[130px] pointer-events-none animate-glow-loop" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-vivid-cyan/8 blur-[120px] pointer-events-none animate-glow-loop" />
      
      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center px-6 py-8 relative z-10">
        
        {/* Navigation Header */}
        <header className="sticky top-4 z-50 w-full max-w-6xl flex justify-between items-center mb-16 py-4 px-6 rounded-full glass-panel border-white/5 bg-white/[0.02] backdrop-blur-md shadow-lg shadow-black/10 transition-all duration-300">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-electric-purple to-vivid-cyan animate-pulse" />
            <span className="font-mono font-bold tracking-widest text-lg bg-gradient-to-r from-electric-purple to-vivid-cyan bg-clip-text text-transparent">
              SOLAGENT VAULT
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 font-mono text-xs text-zinc-400">
            <a href="/dashboard?view=guide" className="hover:text-white transition-colors">x402 Protocol</a>
            <a href="#guardrails" className="hover:text-white transition-colors">Vault Security</a>
            <a href="https://github.com/HkSolDev/solagent-vault" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              GitHub
            </a>
            <a href="https://x.com/HKsoldev" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              Twitter / X
            </a>
          </nav>

          <div>
            <Link 
              href="/dashboard"
              className="text-xs font-mono px-4 py-2 rounded-full bg-electric-purple hover:bg-electric-purple/90 text-white font-bold transition-all shadow-glow-purple flex items-center gap-1.5 cursor-pointer"
            >
              Launch Console
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="w-full max-w-6xl text-center flex flex-col items-center gap-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-electric-purple bg-electric-purple/10 border border-electric-purple/20 rounded-full px-4.5 py-1.5 shadow-sm shadow-electric-purple/5">
            <span className="w-1.5 h-1.5 rounded-full bg-electric-purple animate-pulse" />
            x402 PROTOCOL READY • SECURE AI PAYMENTS
          </div>
          
          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] max-w-4xl font-sans mt-2">
            Autonomous Payments via{" "}
            <span className="bg-gradient-to-r from-electric-purple via-purple-400 to-vivid-cyan bg-clip-text text-transparent">
              HTTP 402 & Solana
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-zinc-400 max-w-2xl mt-2 leading-relaxed font-mono">
            Empower your AI agents to pay for API access and compute dynamically using the x402 protocol and USDC on Solana—all protected by strict on-chain spending vaults.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-20">
            <Link 
              href="/dashboard"
              className="px-8 py-3.5 rounded-lg font-mono text-sm font-semibold bg-gradient-to-r from-electric-purple to-purple-600 hover:from-electric-purple/95 hover:to-purple-600/95 text-white transition-all hover:scale-[1.01] shadow-lg shadow-electric-purple/25 flex items-center gap-2 cursor-pointer"
            >
              Enter Vault Console
            </Link>
            <a 
              href="/dashboard?view=guide" 
              className="px-8 py-3.5 rounded-lg font-mono text-sm font-semibold border border-glass-border bg-glass-card hover:bg-white/5 transition-all text-zinc-300 flex items-center gap-2 cursor-pointer"
            >
              Explore interactive Flow Guide
            </a>
          </div>

          {/* x402 Protocol Section */}
          <section id="x402-protocol" className="w-full max-w-5xl scroll-mt-24 mb-24 text-left">
            <div className="border-l-2 border-electric-purple pl-4 mb-10">
              <h2 className="text-2xl font-bold font-mono text-white tracking-tight uppercase">
                The x402 Protocol Implementation
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Reviving HTTP 402 "Payment Required" for the Machine-to-Machine Economy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Step 1 */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 bg-white/[0.01]">
                <div className="text-3xl font-mono text-electric-purple font-bold">01</div>
                <h3 className="text-lg font-bold text-white font-mono">Request & Challenge</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Your AI agent requests a premium resource (like an API). The server responds with HTTP 402, demanding payment in USDC via Solana.
                </p>
              </div>

              {/* Step 2 */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 bg-white/[0.01]">
                <div className="text-3xl font-mono text-vivid-cyan font-bold">02</div>
                <h3 className="text-lg font-bold text-white font-mono">Vault Verification</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Before paying, SolAgent Vault checks on-chain policies: Is the destination allowlisted? Is the transaction within the budget limit?
                </p>
              </div>

              {/* Step 3 */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 bg-white/[0.01]">
                <div className="text-3xl font-mono text-purple-400 font-bold">03</div>
                <h3 className="text-lg font-bold text-white font-mono">Sign & Access</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  The transaction is executed instantly on Solana. The AI attaches the cryptographic payment proof to the request and gains immediate access.
                </p>
              </div>

            </div>
          </section>

          {/* Simple Guardrails Section */}
          <section id="guardrails" className="w-full max-w-5xl scroll-mt-24 mb-24 text-left">
            <div className="border-l-2 border-vivid-cyan pl-4 mb-10">
              <h2 className="text-2xl font-bold font-mono text-white tracking-tight uppercase">
                On-Chain Vault Guardrails
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Zero trust architecture. Even if your AI is compromised, your main treasury is safe.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <div className="glass-panel p-8 rounded-2xl text-left flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-electric-purple/10 border border-electric-purple/15 flex items-center justify-center text-lg shadow-sm font-semibold font-mono text-electric-purple">
                  ⏱️
                </div>
                <h3 className="text-lg font-bold text-white font-mono tracking-tight">Rate-Limited Spends</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Rolling budget caps prevent infinite loops. If an AI agent gets stuck retrying a 402 request, the vault forcefully halts payments.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-panel p-8 rounded-2xl text-left flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-vivid-cyan/10 border border-vivid-cyan/15 flex items-center justify-center text-lg shadow-sm font-semibold font-mono text-vivid-cyan">
                  🎯
                </div>
                <h3 className="text-lg font-bold text-white font-mono tracking-tight">Strict Allowlists</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Agents can only execute payments to cryptographic addresses you explicitly trust (e.g., OpenAI, DeepSeek, AWS).
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-panel p-8 rounded-2xl text-left flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-emergency-red/10 border border-emergency-red/15 flex items-center justify-center text-lg shadow-sm font-semibold font-mono text-emergency-red">
                  🛑
                </div>
                <h3 className="text-lg font-bold text-white font-mono tracking-tight">Kill Switch</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Decommission the entire fleet. One tap triggers an emergency freeze on the blockchain, neutralizing all compromised agents instantly.
                </p>
              </div>

            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="w-full max-w-6xl text-center text-[10px] text-zinc-500 font-mono mt-16 pt-8 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-4">
          <span>SolAgent Vault • Powering the x402 Protocol on Solana.</span>
          <a href="https://x.com/HKsoldev" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors">
            Built by @HKsoldev
          </a>
        </footer>

      </div>
    </div>
  );
}
