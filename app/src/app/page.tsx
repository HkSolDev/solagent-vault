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
              href="#pitch-deck" 
              className="px-8 py-3.5 rounded-lg font-mono text-sm font-semibold border border-electric-purple/30 bg-electric-purple/5 hover:bg-electric-purple/10 transition-all text-purple-300 flex items-center gap-2 cursor-pointer"
            >
              ⚡ 2-Minute Demo Slides
            </a>
            <a 
              href="#how-it-works" 
              className="px-8 py-3.5 rounded-lg font-mono text-sm font-semibold border border-glass-border bg-glass-card hover:bg-white/5 transition-all text-zinc-300 flex items-center gap-2 cursor-pointer"
            >
              See How it Works
            </a>
          </div>

          {/* Interactive 2-Minute Pitch Deck Section */}
          <section id="pitch-deck" className="w-full max-w-5xl scroll-mt-24 mb-24 text-left">
            <div className="border-l-2 border-electric-purple pl-4 mb-8">
              <h2 className="text-2xl font-bold font-mono text-white tracking-tight uppercase flex items-center gap-2">
                <span>⚡ 2-Minute Pitch Presentation Deck</span>
                <span className="text-xs font-normal text-zinc-400 normal-case bg-zinc-800/80 px-2 py-0.5 rounded-full">Graduation Exam Mode</span>
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                One unified screen detailing the Problem, Security Guardrail Hierarchy, and passing Edge-Case tests.
              </p>
            </div>

            <PitchDeckSlider />
          </section>

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

function PitchDeckSlider() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "1. The Paradigm Shift (Problem & Solution)",
      subtitle: "Why autonomous AI agents need secure on-chain sandbox budgets.",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-xl border-red-500/20 bg-red-950/5">
            <h4 className="text-red-400 font-mono font-bold text-sm uppercase mb-3 flex items-center gap-1.5">
              <span>⚠️</span> The Fatal Flaw of AI Hot-Keys
            </h4>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed mb-4">
              Traditional AI Agents are pre-funded with raw hot wallet keys or shared API keys. If the agent's logic hits an infinite loop, succumbs to prompt-injection, or the host machine gets hacked:
            </p>
            <ul className="text-xs text-zinc-300 font-mono space-y-2 list-disc list-inside">
              <li>Your entire treasury can be drained instantly.</li>
              <li>Recursive api calls result in huge cloud bills.</li>
              <li>Zero on-chain authorization limits.</li>
            </ul>
          </div>
          <div className="glass-panel p-6 rounded-xl border-emerald-500/20 bg-emerald-950/5">
            <h4 className="text-emerald-400 font-mono font-bold text-sm uppercase mb-3 flex items-center gap-1.5">
              <span>🛡️</span> The On-Chain Sandbox Vault
            </h4>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed mb-4">
              <strong>SolAgent Vault</strong> isolates capital in a secure, on-chain Program Derived Address (PDA) vault. The AI agent uses a throwaway hot-key containing almost zero funds, and:
            </p>
            <ul className="text-xs text-zinc-300 font-mono space-y-2 list-disc list-inside">
              <li>USDC lies protected in the smart-contract vault.</li>
              <li>Every spend must pass 5 security validations on-chain.</li>
              <li>Immediate developer override (tap-to-freeze).</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "2. The On-Chain Security Hierarchy (Guardrails)",
      subtitle: "The chronological security validations executed on-chain before a transfer is authorized.",
      content: (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { num: "01", name: "Active Switch", desc: "Instantly freezes all agent operations when paused by the owner.", color: "border-purple-500/30 text-purple-400" },
              { num: "02", name: "Allowlist Guard", desc: "Limits outgoing payments only to pre-authorized API provider wallets.", color: "border-cyan-500/30 text-cyan-400" },
              { num: "03", name: "Single-Call Cap", desc: "Rejects any individual transaction requesting more than the cap.", color: "border-indigo-500/30 text-indigo-400" },
              { num: "04", name: "Rate-Limit Guard", desc: "Restricts cumulative per-minute spending to stop recursive budget loops.", color: "border-emerald-500/30 text-emerald-400" },
              { num: "05", name: "Balance Check", desc: "Ensures the isolated PDA vault has sufficient token liquidity.", color: "border-pink-500/30 text-pink-400" },
            ].map((step, idx) => (
              <div key={idx} className={`glass-panel p-4 rounded-xl border ${step.color} flex flex-col gap-2`}>
                <div className="text-xs font-mono opacity-60">Step {step.num}</div>
                <div className="text-sm font-bold font-mono tracking-tight">{step.name}</div>
                <div className="text-[10px] text-zinc-400 font-mono leading-normal">{step.desc}</div>
              </div>
            ))}
          </div>
          <div className="glass-panel p-4 rounded-xl bg-purple-950/10 border-purple-500/20 text-xs font-mono text-zinc-400 flex items-center justify-between mt-2">
            <span>💡 <strong>Architectural Note:</strong> Guards run in strict order. A downstream guard (e.g. Rate-Limit) will never be reached if an upstream guard (e.g. Single-Call Cap) fails.</span>
          </div>
        </div>
      ),
    },
    {
      title: "3. Devnet Verification & Edge Cases",
      subtitle: "10 passing integration tests verifying happy paths and strict edge case reverts.",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 flex flex-col gap-3 font-mono">
            <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">DEVNET CONTRACT:</span>
                <span className="text-purple-400 font-bold">C5pqn3tYpivcZi...Rxr7o</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-emerald-400 font-bold mb-2 flex items-center gap-1">
                    <span>🟢</span> Happy Path Tests (6)
                  </div>
                  <ul className="text-[11px] text-zinc-400 space-y-1">
                    <li>✓ Initialize Master Vault</li>
                    <li>✓ Create & Fund Agent PDA</li>
                    <li>✓ Deposit USDC to PDA</li>
                    <li>✓ Authorized Spend Action</li>
                    <li>✓ Withdraw Funds to Owner</li>
                    <li>✓ Close Agent & Sweep Rent</li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs text-cyan-400 font-bold mb-2 flex items-center gap-1">
                    <span>🛡️</span> Security Edge Cases (4)
                  </div>
                  <ul className="text-[11px] text-zinc-400 space-y-1">
                    <li>✓ Revert: Exceeds Single-Call Cap</li>
                    <li>✓ Revert: Exceeds Rate-Limit</li>
                    <li>✓ Revert: Unauthorized Recipient</li>
                    <li>✓ Revert: Over-withdrawal Fails</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="glass-panel px-4 py-3 rounded-lg border-zinc-800 flex justify-between items-center text-xs">
              <span className="text-zinc-500">Suite Execution Time: ~1m</span>
              <a 
                href="/devnet_tests_screenshot.png"
                target="_blank"
                className="text-[10px] bg-electric-purple text-white px-2.5 py-1 rounded hover:bg-electric-purple/90 transition-all font-bold"
              >
                View Execution Screenshot
              </a>
            </div>
          </div>
          
          <div className="md:col-span-5 flex flex-col justify-center items-center">
            <div className="relative group overflow-hidden rounded-xl border border-zinc-850 bg-black max-w-[280px]">
              <img 
                src="/devnet_tests_screenshot.png" 
                alt="Devnet tests proof" 
                className="opacity-70 group-hover:opacity-90 transition-opacity duration-300 w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex items-end justify-center p-3">
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-zinc-900/90 px-3 py-1 rounded-full border border-emerald-500/20">
                  ✓ 10 Tests Passing on Devnet
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border-zinc-800 bg-zinc-950/10 shadow-2xl relative overflow-hidden">
      
      {/* Slide Navigation Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-zinc-900 pb-5">
        <div className="flex gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                activeSlide === idx
                  ? "bg-electric-purple text-white shadow-glow-purple"
                  : "bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white"
              }`}
            >
              Slide {idx + 1}
            </button>
          ))}
        </div>
        
        <div className="text-zinc-500 font-mono text-xs">
          Slide {activeSlide + 1} of {slides.length}
        </div>
      </div>

      {/* Main Slide Card */}
      <div className="min-h-[220px] transition-all duration-300 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold font-mono text-white mb-1 tracking-tight">
            {slides[activeSlide].title}
          </h3>
          <p className="text-xs text-zinc-400 font-mono mb-6">
            {slides[activeSlide].subtitle}
          </p>
          
          <div className="animate-fade-in">
            {slides[activeSlide].content}
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-zinc-900">
          <button
            onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1))}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-mono text-xs font-semibold cursor-pointer transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={() => setActiveSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0))}
            className="px-4 py-2 rounded-lg bg-electric-purple hover:bg-electric-purple/90 text-white font-mono text-xs font-semibold cursor-pointer transition-colors"
          >
            Next Slide →
          </button>
        </div>
      </div>

    </div>
  );
}

