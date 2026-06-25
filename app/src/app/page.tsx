"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e131e] text-[#e2e8f0]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-on-surface font-body-md">
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-surface/80 backdrop-blur-xl shadow-[0_0_20px_rgba(0,242,255,0.08)]">
        <div className="mx-auto flex h-16 w-full max-w-[1380px] items-center justify-between px-4 md:px-6">
          <div className="text-xl font-bold text-primary md:text-3xl font-display-lg">Solagent Vault</div>

          <div className="hidden items-center gap-7 text-sm md:flex">
            <a className="border-b-2 border-primary pb-1 text-primary" href="#">Dashboard</a>
            <Link className="text-on-surface-variant transition-colors hover:text-primary" href="/dashboard">Fleet</Link>
            <Link className="text-on-surface-variant transition-colors hover:text-primary" href="/dashboard">Analytics</Link>
            <Link className="text-on-surface-variant transition-colors hover:text-primary" href="/dashboard">Security</Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined hidden cursor-pointer text-on-surface-variant transition-colors hover:text-primary md:inline-flex">notifications</span>
            <span className="material-symbols-outlined hidden cursor-pointer text-on-surface-variant transition-colors hover:text-primary md:inline-flex">settings</span>
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-all hover:opacity-95 md:px-6 primary-glow"
            >
              Connect Wallet
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section className="relative flex min-h-[860px] items-center justify-center px-4">
          <div className="absolute left-1/2 top-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
          <div className="mx-auto flex w-full max-w-[760px] flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-widest text-primary font-label-mono">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Live on Solana Mainnet
            </div>

            <h1 className="font-display-lg text-5xl font-extrabold leading-[1.05] tracking-[-0.02em] text-on-surface md:text-[72px]">
              Secure AI Agents with
              <br />
              <span className="text-gradient">Smart Spending Limits</span>
            </h1>

            <p className="max-w-[700px] text-base leading-relaxed text-on-surface-variant md:text-[28px] md:leading-10 md:font-light md:tracking-[-0.01em]">
              The ultimate on-chain sandbox for autonomous agents. Deploy AI fleets with programmatic guardrails, isolated PDAs, and real-time transaction monitoring.
            </p>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="rounded-xl bg-primary px-10 py-4 text-lg font-bold text-on-primary primary-glow transition-all hover:-translate-y-0.5"
              >
                Launch Dashboard
              </Link>
              <a
                href="https://github.com/HkSolDev/solagent-vault"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 px-10 py-4 text-lg font-bold text-on-surface transition-all hover:bg-white/10"
              >
                View Documentation
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1380px] px-2 pb-8 md:px-4">
          <div className="mb-10 text-center">
            <h2 className="text-5xl font-extrabold md:text-[56px] font-display-lg">How it Works</h2>
            <p className="mt-2 text-on-surface-variant">Three steps to autonomous security.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="glass-card rounded-xl p-6">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              </div>
              <h3 className="text-3xl font-bold font-display-lg">Create Safe</h3>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                Initialize a Program Derived Address (PDA) that acts as the dedicated vault for your AI agent. Assets never leave the sandbox.
              </p>
            </article>

            <article className="glass-card rounded-xl p-6">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-secondary/30 bg-secondary/10">
                <span className="material-symbols-outlined text-secondary">lock_open</span>
              </div>
              <h3 className="text-3xl font-bold font-display-lg">Enforce Limits</h3>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                Define granular rules: max spend per transaction, daily volume caps, and whitelisted protocols. The blockchain enforces them.
              </p>
            </article>

            <article className="glass-card rounded-xl p-6">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-tertiary/30 bg-tertiary/10">
                <span className="material-symbols-outlined text-tertiary">shield_with_heart</span>
              </div>
              <h3 className="text-3xl font-bold font-display-lg">Absolute Protection</h3>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                Even if your agent&apos;s logic is compromised, the Vault stops unauthorized outflows instantly via on-chain validation.
              </p>
            </article>
          </div>
        </section>

        <section className="bg-surface-container-low/60 py-10">
          <div className="mx-auto grid w-full max-w-[1380px] grid-cols-1 gap-8 px-2 md:px-4 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-5xl font-extrabold leading-tight font-display-lg md:text-[64px]">
                Why On-Chain
                <br />
                <span className="text-secondary">Sandboxing?</span>
              </h2>
              <p className="mt-4 text-lg text-on-surface-variant">
                Traditional agent deployments rely on "Trust Me" API keys. Solagent Vault replaces trust with code.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-rose-400">cancel</span>
                  <div>
                    <h4 className="font-bold text-on-surface">The Problem: Infinite Loops &amp; Drainers</h4>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Shared keys and unmonitored scripts can drain entire wallets in seconds during an AI hallucination or bug.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-secondary">check_circle</span>
                  <div>
                    <h4 className="font-bold text-on-surface">The Solution: Isolated PDAs</h4>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Every agent operates in its own cryptographic vault. Limits are hardcoded into the Solana program, making them unskippable.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 to-tertiary/30 blur opacity-30 transition-opacity duration-500 group-hover:opacity-60" />
              <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-[#101827]">
                <img
                  alt="Isolated secure data nodes"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBW4lcTF0a8OG4PlEjjRBqJ06w_G9XOV1ZyrNd_85pNIhsXxSqAHEPEAdYFO22CVzmGKscDb1mKTI_pxORAoRW-XQGOTBYMy1OIiGEswB8e3a9KNnCKGEJ0AHgnogBee64LSBcNHCegb-dcLP0cAO5DiDkknYUENODZiQa-RO_dnQyTGlBhYUjoYc9aR-VArBSYHSFqfpS0qVdNAyx2rjNLaVrrhiw5RjwTHs1CA_I2HFSSMkl_-Y6yEukuw3WDR-v9Zrr4SRpZJUla"
                  className="h-full w-full object-cover opacity-85"
                />
                <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/10 bg-surface/70 p-3 backdrop-blur">
                  <div className="mb-2 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-primary">AGENT_FLEET_04</span>
                    <span className="rounded border border-secondary/20 bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
                      ACTIVE
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-variant">
                    <div className="h-full w-2/3 bg-gradient-to-r from-primary to-tertiary" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
                    <span>DAILY LIMIT: 50 SOL</span>
                    <span>USED: 32.4 SOL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1380px] px-2 py-10 md:px-4">
          <div className="glass-card rounded-3xl border border-white/5 p-6 md:p-10">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[220px_1fr]">
              <div className="mx-auto">
                <div className="relative h-40 w-40">
                  <div className="absolute inset-0 animate-[spin_18s_linear_infinite] rounded-full border-2 border-dashed border-primary/30" />
                  <div className="absolute inset-4 rounded-full border border-secondary/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified_user
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-5xl font-extrabold font-display-lg md:text-[52px]">Built Securely for the AI Era</h2>
                <p className="mt-4 text-on-surface-variant">
                  Solagent Vault is engineered with a security-first mindset. From formal verification of our Rust programs to a zero-trust architecture, we provide the industrial-grade rails required for AI-native finance.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-3xl font-bold text-secondary font-display-lg">100%</p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">Open Source</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-3xl font-bold text-tertiary font-display-lg">0.4s</p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">Settlement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-14 text-center">
          <div className="absolute left-1/2 top-1/2 -z-10 h-[440px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/15 via-tertiary/10 to-primary/15 blur-[100px]" />
          <div className="mx-auto max-w-[760px] px-4">
            <h2 className="text-5xl font-extrabold font-display-lg md:text-[64px]">Ready to Secure Your Agents?</h2>
            <p className="mt-4 text-lg text-on-surface-variant">
              Join 500+ developers building the future of autonomous finance on the safest platform in the ecosystem.
            </p>
            <div className="mt-8">
              <Link
                href="/dashboard"
                className="inline-block rounded-2xl bg-primary px-10 py-4 text-xl font-bold text-on-primary transition-all hover:opacity-95 primary-glow"
              >
                Launch Dashboard Now
              </Link>
              <p className="mt-4 text-xs uppercase tracking-wide text-on-surface-variant font-label-mono">
                No registration required • Connect wallet to start
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-white/5 bg-surface-container-lowest py-12">
        <div className="mx-auto flex w-full max-w-[1380px] flex-col items-center gap-5 px-4">
          <div className="text-3xl font-bold text-on-surface font-display-lg">Solagent Vault</div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-on-surface-variant">
            <a className="transition-colors hover:text-secondary" href="#">Terms</a>
            <a className="transition-colors hover:text-secondary" href="#">Privacy</a>
            <a className="transition-colors hover:text-secondary" href="#">Status</a>
            <a className="transition-colors hover:text-secondary" href="https://x.com/HKsoldev" target="_blank" rel="noreferrer">Twitter</a>
            <a className="transition-colors hover:text-secondary" href="https://github.com/HkSolDev/solagent-vault" target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <p className="text-sm text-on-surface-variant/60">© 2024 Solagent Vault. Secured by Solana.</p>
        </div>
      </footer>
    </div>
  );
}
