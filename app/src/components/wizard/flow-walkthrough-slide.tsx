"use client";

import React, { useState } from "react";

const slides = [
  {
    title: "The Problem: HTTP 402",
    description: "In the modern web, AI agents encounter '402 Payment Required' errors when trying to access premium APIs or compute. Without a secure way to pay, they stall.",
    icon: "🚫",
    color: "text-emergency-red",
    bg: "bg-emergency-red/10",
  },
  {
    title: "SolAgent Vault Architecture",
    description: "SolAgent Vault introduces on-chain spending guardrails. It allows you to delegate funds to AI agents while maintaining absolute control over how they are spent.",
    icon: "🛡️",
    color: "text-electric-purple",
    bg: "bg-electric-purple/10",
  },
  {
    title: "Step 1: Vault Initialization",
    description: "The main treasury is initialized on the Solana blockchain. This central vault holds the core policies and manages the global configuration for your agent fleet.",
    icon: "💰",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "Step 2: Spawning Agent PDAs",
    description: "Each AI agent is assigned a Program Derived Address (PDA). These are isolated 'smart accounts' with custom policies: max spend per call, minute limits, and provider allowlists.",
    icon: "🛰️",
    color: "text-vivid-cyan",
    bg: "bg-vivid-cyan/10",
  },
  {
    title: "Step 3: Verification & Spend",
    description: "When an agent needs to pay, the SolAgent Vault program verifies the request against on-chain policies. If it passes, the vault signs the transaction instantly.",
    icon: "✅",
    color: "text-success-emerald",
    bg: "bg-success-emerald/10",
  },
  {
    title: "Step 4: Premium Access",
    description: "The payment proof is sent to the service provider. The AI gains immediate access to the resource, while you have a full on-chain audit trail of every cent spent.",
    icon: "🚀",
    color: "text-white",
    bg: "bg-white/5",
  },
];

export default function FlowWalkthroughSlide() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[currentSlide];

  return (
    <div className="glass-panel p-8 rounded-2xl flex flex-col gap-6 bg-black/40 border border-glass-border/50 shadow-2xl relative overflow-hidden min-h-[400px] justify-center">
      <div className={"absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 transition-all duration-700 " + slide.bg} />
      
      <div className="flex flex-col gap-4 relative z-10 text-center items-center">
        <div className={"w-16 h-16 rounded-2xl " + slide.bg + " flex items-center justify-center text-3xl shadow-inner border border-white/5 mb-2"}>
          {slide.icon}
        </div>
        
        <div className="flex flex-col gap-2">
          <h3 className={"text-2xl font-bold font-mono tracking-tight " + slide.color}>
            {slide.title}
          </h3>
          <p className="text-sm text-zinc-400 font-mono leading-relaxed max-w-lg mx-auto">
            {slide.description}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4 relative z-10">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className={"w-1.5 h-1.5 rounded-full transition-all duration-300 " + (idx === currentSlide ? "bg-electric-purple w-6" : "bg-zinc-700")}
          />
        ))}
      </div>

      <div className="flex justify-between items-center mt-6 relative z-10">
        <button
          onClick={prevSlide}
          className="text-xs font-mono font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1 cursor-pointer px-4 py-2"
        >
          ← PREV
        </button>
        
        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-bold">
          Slide {currentSlide + 1} of {slides.length}
        </span>

        <button
          onClick={nextSlide}
          className="text-xs font-mono font-bold text-electric-purple hover:text-purple-400 transition-colors flex items-center gap-1 cursor-pointer px-4 py-2"
        >
          {currentSlide === slides.length - 1 ? "RESTART" : "NEXT"} →
        </button>
      </div>
    </div>
  );
}
