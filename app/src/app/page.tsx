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
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#guardrails" className="hover:text-white transition-colors">Safety Rules</a>
            <a href="https://github.com/HkSolDev/solagent-vault" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              GitHub Code
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
            THE SMART ON-CHAIN SAFEGUARD FOR AI AGENTS
          </div>
          
          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] max-w-4xl font-sans mt-2">
            Secure AI Agents with{" "}
            <span className="bg-gradient-to-r from-electric-purple via-purple-400 to-vivid-cyan bg-clip-text text-transparent">
              Smart Spending Limits
            </span>{" "}
            on Solana
          </h1>

          <p className="text-sm sm:text-lg text-zinc-400 max-w-2xl mt-2 leading-relaxed font-mono">
            Imagine giving your AI assistant a bank card with a strict spending budget. Solagent Vault does exactly that on-chain, preventing loops, prompt attacks, and hackers from ever draining your funds.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-20">
            <Link 
              href="/dashboard"
              className="px-8 py-3.5 rounded-lg font-mono text-sm font-semibold bg-gradient-to-r from-electric-purple to-purple-600 hover:from-electric-purple/95 hover:to-purple-600/95 text-white transition-all hover:scale-[1.01] shadow-lg shadow-electric-purple/25 flex items-center gap-2 cursor-pointer"
            >
              Go to Developer Console
            </Link>
            <a 
              href="#how-it-works" 
              className="px-8 py-3.5 rounded-lg font-mono text-sm font-semibold border border-glass-border bg-glass-card hover:bg-white/5 transition-all text-zinc-300 flex items-center gap-2 cursor-pointer"
            >
              See How it Works
            </a>
          </div>

          {/* Simple How It Works Section */}
          <section id="how-it-works" className="w-full max-w-5xl scroll-mt-24 mb-24 text-left">
            <div className="border-l-2 border-electric-purple pl-4 mb-10">
              <h2 className="text-2xl font-bold font-mono text-white tracking-tight uppercase">
                How Solagent Vault Works (In Simple Terms)
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                You don't need to be a crypto wizard or a software engineer to understand this.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Step 1 */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 bg-white/[0.01]">
                <div className="text-3xl font-mono text-electric-purple font-bold">01</div>
                <h3 className="text-lg font-bold text-white font-mono">Create an On-Chain Safe</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Instead of handing your main wallet key directly to an AI agent, you set up a dedicated secure locker (called a PDA) on the Solana network. You only fund it with what the agent needs.
                </p>
              </div>

              {/* Step 2 */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 bg-white/[0.01]">
                <div className="text-3xl font-mono text-vivid-cyan font-bold">02</div>
                <h3 className="text-lg font-bold text-white font-mono">Enforce Rigid Limits</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  You configure rules: "My AI agent can only spend up to $5 per transaction, a maximum of $50 per day, and can ONLY send money to OpenAI or DeepSeek to pay for its thoughts."
                </p>
              </div>

              {/* Step 3 */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 bg-white/[0.01]">
                <div className="text-3xl font-mono text-purple-400 font-bold">03</div>
                <h3 className="text-lg font-bold text-white font-mono">Absolute Protection</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  If the AI experiences a code crash, runs into an infinite loop, or is targeted by malicious prompt-injection attacks, the on-chain smart rules block the transaction instantly.
                </p>
              </div>

            </div>
          </section>

          {/* Simple Guardrails Section */}
          <section id="guardrails" className="w-full max-w-5xl scroll-mt-24 mb-24 text-left">
            <div className="border-l-2 border-vivid-cyan pl-4 mb-10">
              <h2 className="text-2xl font-bold font-mono text-white tracking-tight uppercase">
                The Bulletproof Safety Guardrails
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Engineered from the ground up to protect on-chain assets automatically in real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <div className="glass-panel p-8 rounded-2xl text-left flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-electric-purple/10 border border-electric-purple/15 flex items-center justify-center text-lg shadow-sm font-semibold font-mono text-electric-purple">
                  ⏱️
                </div>
                <h3 className="text-lg font-bold text-white font-mono tracking-tight">Minute Budget Limits</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Stop budget drain loops. If your AI goes haywire and calls an API 1,000 times a minute, the vault blocks all requests exceeding your short-term limits.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-panel p-8 rounded-2xl text-left flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-vivid-cyan/10 border border-vivid-cyan/15 flex items-center justify-center text-lg shadow-sm font-semibold font-mono text-vivid-cyan">
                  🎯
                </div>
                <h3 className="text-lg font-bold text-white font-mono tracking-tight">Allowed Destination List</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Prevent target hijack attacks. The AI can only send funds to pre-authorized recipient addresses. Any hacker's address will be immediately rejected on-chain.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-panel p-8 rounded-2xl text-left flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-emergency-red/10 border border-emergency-red/15 flex items-center justify-center text-lg shadow-sm font-semibold font-mono text-emergency-red">
                  🛑
                </div>
                <h3 className="text-lg font-bold text-white font-mono tracking-tight">Tap-To-Freeze Override</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  As the ultimate human-in-the-loop, you have a master switch. With one tap, you can freeze the entire vault, blocking all outgoing token transfers in a single block.
                </p>
              </div>

            </div>
          </section>

          {/* Open-Source Tech Stack Info */}
          <section className="w-full max-w-5xl text-left mb-20">
            <div className="glass-panel p-10 rounded-2xl w-full border border-zinc-800/80 bg-zinc-950/20 flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex flex-col gap-2 max-w-2xl">
                <h3 className="text-xl font-bold font-mono text-white">Built Securely on Solana & Anchor</h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  Solagent Vault compiles directly to high-performance, audit-ready Rust instructions. All balance validation is enforced directly by the Solana Surfnet ledger, allowing zero-signature autonomous solver threads to run cleanly in the background without needing your wallet to confirm every action.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850 text-zinc-300 border border-zinc-700/50">Rust (Anchor)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850 text-zinc-300 border border-zinc-700/50">Next.js 15+</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850 text-zinc-300 border border-zinc-700/50">Solana Devnet / Localnet</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850 text-zinc-300 border border-zinc-700/50">Autonomous Solver hotkey</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
                <a 
                  href="https://github.com/HkSolDev/solagent-vault" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-6 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-semibold text-center transition-all cursor-pointer"
                >
                  View GitHub Repository
                </a>
              </div>
            </div>
          </section>

          {/* Quick Sandbox Callout */}
          <div className="glass-panel p-10 rounded-2xl w-full max-w-5xl border border-electric-purple/35 bg-electric-purple/[0.03] text-center flex flex-col items-center gap-4 relative overflow-hidden mb-12">
            <div className="absolute top-0 right-0 w-32 h-32 bg-electric-purple/10 blur-2xl pointer-events-none" />
            <h3 className="text-xl font-bold font-mono text-white">Test the Security Sandbox Live</h3>
            <p className="text-xs text-zinc-400 font-mono max-w-xl leading-relaxed">
              Launch our developer dashboard to interact with an emulated Solana blockchain ledger, spawn your secure automated solver keys, and watch rules trigger in real-time.
            </p>
            <Link 
              href="/dashboard"
              className="px-8 py-3 rounded bg-electric-purple hover:bg-electric-purple/90 text-white font-mono text-sm font-semibold transition-all shadow-glow-purple cursor-pointer mt-2"
            >
              Open Sandbox Console
            </Link>
          </div>

        </main>

        {/* Footer */}
        <footer className="w-full max-w-6xl text-center text-[10px] text-zinc-500 font-mono mt-16 pt-8 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-4">
          <span>SolAgent Vault • 100% On-Chain Security Guards for Autonomous AI Workers.</span>
          <a href="https://x.com/HKsoldev" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors">
            Built by @HKsoldev
          </a>
        </footer>

      </div>
    </div>
  );
}
