"use client";

import React, { useState } from "react";
import { OnChainAgent } from "../../hooks/use-agent-state";

interface FleetGridProps {
  agents: OnChainAgent[];
  activeAgentId: number;
  onSelectAgent: (id: number) => void;
  onTogglePause: (agent: OnChainAgent) => Promise<void>;
  onDeposit: (id: number, amount: string) => Promise<void>;
  onWithdraw: (id: number, amount: string) => Promise<void>;
  onCloseAgent: (id: number) => Promise<void>;
  onLiveAISolveForAgent: (id: number) => void; // Opens modal
  onBatchRunSolvers: () => void; // Opens modal
  onEmergencyFleetFreeze: () => Promise<void>;
  onCloseAllAgents: () => Promise<void>;
  actionLoading: boolean;
}

export default function FleetGrid({
  agents,
  activeAgentId,
  onSelectAgent,
  onTogglePause,
  onDeposit,
  onWithdraw,
  onCloseAgent,
  onLiveAISolveForAgent,
  onBatchRunSolvers,
  onEmergencyFleetFreeze,
  onCloseAllAgents,
  actionLoading,
}: FleetGridProps) {
  const activeCount = agents.filter((a) => a.status === "Active").length;

  // Local state to track the custom deposit amount for each agent ID independently
  const [depositAmounts, setDepositAmounts] = useState<Record<number, string>>({});

  return (
    <div className="w-full glass-panel p-6 rounded-xl border border-glass-border flex flex-col gap-5 mt-10 bg-white/[0.01]">
      {/* Fleet diagnostic header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-glass-border/30">
        <div>
          <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <span className="text-vivid-cyan">🛰️</span> MULTI-AGENT FLEET CONTROLLER
          </h3>
          <p className="text-[11px] text-zinc-400 font-mono mt-1">
            Spawn isolated delegated agent PDAs, fund them directly, and trigger sequential batch AI solvers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono px-3 py-1 bg-black/40 border border-glass-border/40 rounded text-zinc-400">
            Active Agents: <span className="text-success-emerald font-bold">{activeCount}/{agents.length}</span>
          </span>

          <button
            onClick={onBatchRunSolvers}
            disabled={actionLoading || agents.length === 0}
            className="text-[10px] font-mono font-bold px-3.5 py-1.5 rounded bg-gradient-to-r from-electric-purple to-purple-600 hover:opacity-90 text-white cursor-pointer shadow-glow-purple disabled:opacity-50 flex items-center gap-1"
          >
            <span>⚡</span> Run All Solvers
          </button>

          <button
            onClick={onEmergencyFleetFreeze}
            disabled={actionLoading || activeCount === 0}
            className="text-[10px] font-mono font-bold px-3.5 py-1.5 rounded bg-emergency-red/10 hover:bg-emergency-red/20 text-emergency-red border border-emergency-red/20 cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            <span>🔒</span> Fleet Freeze
          </button>

          <button
            onClick={onCloseAllAgents}
            disabled={actionLoading || agents.length === 0}
            className="text-[10px] font-mono font-bold px-3.5 py-1.5 rounded bg-emergency-red/20 hover:bg-emergency-red/30 text-white border border-emergency-red cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            <span>🗑️</span> Decommission All
          </button>
        </div>
      </div>

      {/* Grid wrapper */}
      {agents.length === 0 ? (
        <div className="p-10 text-center rounded border border-dashed border-glass-border/50 text-zinc-500 font-mono text-xs">
          📡 No active delegated Agent PDAs detected. Spawn a new agent in Step 2 above!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const isSelected = activeAgentId === agent.id;
            const currentDepositVal = depositAmounts[agent.id] !== undefined ? depositAmounts[agent.id] : "10.0";

            return (
              <div
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                className={`glass-panel p-4.5 rounded-lg border transition-all duration-300 flex flex-col gap-3.5 cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? "border-electric-purple bg-electric-purple/[0.03] shadow-[0_0_15px_rgba(147,51,234,0.06)]"
                    : "border-glass-border/30 hover:border-glass-border/80 hover:bg-white/[0.01]"
                }`}
              >
                {/* Active checkmark glow */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-electric-purple/10 blur-xl pointer-events-none" />
                )}

                {/* Agent Card Header */}
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      agent.status === "Active" ? "bg-success-emerald animate-pulse" : "bg-emergency-red"
                    }`} />
                    <h4 className="font-mono font-bold text-white text-xs">Agent #{agent.id}</h4>
                  </div>
                  
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase border ${
                    agent.status === "Active"
                      ? "bg-success-emerald/10 border-success-emerald/20 text-success-emerald"
                      : "bg-emergency-red/10 border-emergency-red/20 text-emergency-red"
                  }`}>
                    {agent.status}
                  </span>
                </div>

                {/* Key diagnostics table */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[10px] font-mono text-zinc-400 border-t border-b border-glass-border/30 py-2.5 relative z-10">
                  <div>
                    Vault Bal:{" "}
                    <span className="text-white font-bold">${agent.balance.toFixed(2)}</span>
                  </div>
                  <div>
                    Single Cap:{" "}
                    <span className="text-white font-bold">${agent.maxPerCall.toFixed(2)}</span>
                  </div>
                  <div className="col-span-2 truncate">
                    PDA: <span className="text-zinc-300 font-bold select-all">{agent.publicKey}</span>
                  </div>
                </div>

                {/* Multi-Agent actions button drawer */}
                <div className="grid grid-cols-2 gap-2 mt-1.5 relative z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLiveAISolveForAgent(agent.id);
                    }}
                    disabled={actionLoading || agent.status !== "Active" || agent.balance <= 0}
                    className="py-1.5 rounded bg-electric-purple/15 hover:bg-electric-purple/25 text-electric-purple border border-electric-purple/35 font-bold font-mono text-[9px] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-all"
                  >
                    <span>🤖</span> Run Solver
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePause(agent);
                    }}
                    disabled={actionLoading}
                    className={`py-1.5 rounded font-bold font-mono text-[9px] border cursor-pointer transition-all ${
                      agent.status === "Active"
                        ? "bg-emergency-red/15 hover:bg-emergency-red/25 text-emergency-red border-emergency-red/35"
                        : "bg-success-emerald/15 hover:bg-success-emerald/25 text-success-emerald border-success-emerald/35"
                    }`}
                  >
                    {agent.status === "Active" ? "🔒 Pause" : "🔓 Activate"}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWithdraw(agent.id, agent.balance.toString());
                    }}
                    disabled={actionLoading || agent.balance <= 0}
                    className="py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-glass-border font-bold font-mono text-[9px] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    💸 Drain Vault
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseAgent(agent.id);
                    }}
                    disabled={actionLoading}
                    className="py-1.5 rounded bg-emergency-red/10 hover:bg-emergency-red/20 text-emergency-red border border-emergency-red/25 font-bold font-mono text-[9px] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    ❌ De-register
                  </button>
                </div>

                {/* Inline Funding Drawer (Direct Deposit) */}
                <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-glass-border/30 relative z-10">
                  <input
                    type="text"
                    value={currentDepositVal}
                    onChange={(e) => {
                      e.stopPropagation();
                      setDepositAmounts({ ...depositAmounts, [agent.id]: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white/5 border border-glass-border px-2 py-1 rounded text-white font-mono text-[10px] max-w-[65px] text-center focus:outline-none focus:border-electric-purple"
                    placeholder="10.0"
                  />
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Tokens</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeposit(agent.id, currentDepositVal);
                    }}
                    disabled={actionLoading}
                    className="ml-auto py-1 px-3 rounded bg-success-emerald hover:bg-success-emerald/90 text-white font-bold font-mono text-[9px] transition-all cursor-pointer shadow-glow-emerald disabled:opacity-50"
                  >
                    💸 Fund Agent
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
