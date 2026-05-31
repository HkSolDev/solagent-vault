"use client";

import React from "react";

interface CognitiveTelemetry {
  latency: number;
  promptTokens: number;
  completionTokens: number;
  systemInstruction: string;
  userPrompt: string;
  modelOutput: string;
  modelName: string;
}

interface CognitiveAuditPanelProps {
  activeAgentId: number;
  telemetry: CognitiveTelemetry | undefined;
}

export default function CognitiveAuditPanel({
  activeAgentId,
  telemetry,
}: CognitiveAuditPanelProps) {
  if (!telemetry) {
    return (
      <div className="w-full glass-panel p-5 rounded-xl border border-glass-border bg-black/45 shadow-2xl flex flex-col gap-4 text-center py-20">
        <span className="text-xl">🧠</span>
        <h4 className="text-xs font-mono font-bold text-white uppercase">LLM Cognitive Audit Panel</h4>
        <p className="text-[10px] text-zinc-500 font-mono max-w-xs mx-auto">
          No cognitive solver data cached for Agent #{activeAgentId} yet. Run a solver on Fleet Command to populate intelligence audit profiles.
        </p>
      </div>
    );
  }

  const totalTokens = telemetry.promptTokens + telemetry.completionTokens;
  const promptPct = totalTokens > 0 ? (telemetry.promptTokens / totalTokens) * 100 : 0;
  const completionPct = totalTokens > 0 ? (telemetry.completionTokens / totalTokens) * 100 : 0;

  return (
    <div className="w-full glass-panel p-5 rounded-xl border border-glass-border bg-black/45 shadow-2xl flex flex-col gap-4">
      {/* Header section */}
      <div className="flex items-center justify-between pb-3 border-b border-glass-border/30">
        <div>
          <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <span className="text-electric-purple animate-pulse">🧠</span> COGNITIVE AUDIT PROFILE: AGENT #{activeAgentId}
          </h4>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Real-time latency metrics, token consumption ratios, and side-by-side prompt debugger.
          </p>
        </div>
        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-electric-purple/10 border border-electric-purple/20 text-electric-purple uppercase">
          {telemetry.modelName}
        </span>
      </div>

      {/* Grid of Key diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Latency Meter Card */}
        <div className="p-3 bg-black/35 rounded-lg border border-glass-border/20 flex flex-col gap-1.5 relative overflow-hidden">
          <span className="text-[8px] font-mono text-zinc-500 uppercase font-bold">Reasoning Latency</span>
          <span className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
            {telemetry.latency} <span className="text-[10px] text-zinc-400">ms</span>
          </span>
          {/* Latency visual bar chart */}
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-gradient-to-r from-electric-purple to-purple-600 rounded-full"
              style={{ width: `${Math.min((telemetry.latency / 3000) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[8px] font-mono text-zinc-400 mt-0.5">
            {telemetry.latency > 1500 ? "🐢 Cognitive threshold heavy" : "⚡ Latency response optimized"}
          </span>
        </div>

        {/* Token Consumption Card */}
        <div className="p-3 bg-black/35 rounded-lg border border-glass-border/20 flex flex-col gap-1.5 col-span-2">
          <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 uppercase font-bold">
            <span>Token Consumption Ratio</span>
            <span className="text-white font-bold">{totalTokens} Total</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-zinc-300">
            <span>Prompt: <span className="text-electric-purple font-bold">{telemetry.promptTokens}</span></span>
            <span>Completion: <span className="text-vivid-cyan font-bold">{telemetry.completionTokens}</span></span>
          </div>
          {/* Split Ratio Bar */}
          <div className="w-full h-2 bg-zinc-800 rounded-full flex overflow-hidden mt-1">
            <div
              className="h-full bg-electric-purple"
              style={{ width: `${promptPct}%` }}
              title={`Prompt Tokens: ${telemetry.promptTokens}`}
            />
            <div
              className="h-full bg-vivid-cyan animate-pulse"
              style={{ width: `${completionPct}%` }}
              title={`Completion Tokens: ${telemetry.completionTokens}`}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-zinc-500">
            <span>{promptPct.toFixed(0)}% In</span>
            <span>{completionPct.toFixed(0)}% Out</span>
          </div>
        </div>
      </div>

      {/* Collapsible Prompt Debugger details */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold tracking-wider">Cognitive Prompt Debugger</span>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[10px] font-mono">
          {/* Input prompts spec */}
          <div className="flex flex-col gap-1.5">
            <span className="text-zinc-500 text-[8px] uppercase">Input Prompt Spec</span>
            <div className="w-full max-h-[140px] overflow-y-auto bg-black/60 border border-glass-border/20 p-2.5 rounded text-zinc-400 scrollbar-thin select-all whitespace-pre-wrap leading-relaxed">
              <span className="text-electric-purple font-bold">System Instruction:</span>
              <p className="mt-1 pb-2 border-b border-glass-border/10">{telemetry.systemInstruction.trim()}</p>
              <span className="text-electric-purple font-bold mt-2 block">User Challenge:</span>
              <p className="mt-1">{telemetry.userPrompt.trim()}</p>
            </div>
          </div>

          {/* Model outputs JSON */}
          <div className="flex flex-col gap-1.5">
            <span className="text-zinc-500 text-[8px] uppercase">Parsed JSON Tool Invocation</span>
            <div className="w-full max-h-[140px] overflow-y-auto bg-black/60 border border-glass-border/20 p-2.5 rounded text-success-emerald scrollbar-thin select-all whitespace-pre-wrap leading-relaxed font-bold">
              {telemetry.modelOutput.trim()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
