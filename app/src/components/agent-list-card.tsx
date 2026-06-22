"use client";

import React from "react";
import { OnChainAgent } from "../hooks/use-agent-state";

interface AgentListCardProps {
  agent: OnChainAgent;
  isActive: boolean;
  onSelect: () => void;
  onTogglePause: () => void;
  depositAmount: string;
  setDepositAmount: (val: string) => void;
  onDeposit: () => void;
  actionLoading: boolean;
}

export default function AgentListCard({
  agent,
  isActive,
  onSelect,
  onTogglePause,
  depositAmount,
  setDepositAmount,
  onDeposit,
  actionLoading,
}: AgentListCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`glass-panel p-5 rounded-xl flex flex-col gap-3 cursor-pointer ${
        isActive ? "border-electric-purple/60 bg-electric-purple/5" : ""
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-electric-purple animate-pulse" />
          <h4 className="font-mono font-bold text-white">Agent #{agent.id}</h4>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              (agent.status === "Active" && agent.balance > 0)
                ? "bg-success-emerald/10 border-success-emerald/20 text-success-emerald"
                : agent.balance <= 0
                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                : "bg-emergency-red/10 border-emergency-red/20 text-emergency-red"
            }`}
          >
            {agent.status === "Active" && agent.balance <= 0 ? "Unfunded" : agent.status}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePause();
            }}
            className={`text-[10px] font-mono font-bold px-3 py-1 rounded border transition-all ${
              agent.status === "Active"
                ? "bg-emergency-red/10 border-emergency-red/30 text-emergency-red hover:bg-emergency-red/20"
                : "bg-success-emerald/10 border-success-emerald/30 text-success-emerald hover:bg-success-emerald/20"
            }`}
          >
            {agent.status === "Active" ? "Pause" : "Activate"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-400 mt-2">
        <div>
          PDA: <span className="text-zinc-200">{agent.publicKey.substring(0, 6)}...{agent.publicKey.substring(agent.publicKey.length - 6)}</span>
        </div>
        <div>
          Hot-Key: <span className="text-zinc-200">{agent.signer.substring(0, 6)}...{agent.signer.substring(agent.signer.length - 6)}</span>
        </div>
        <div>
          Limit/Call: <span className="text-white font-bold">${agent.maxPerCall.toFixed(2)} USDC</span>
        </div>
        <div>
          Limit/Minute: <span className="text-white font-bold">${agent.maxPerMinute.toFixed(2)} USDC</span>
        </div>
      </div>

      {isActive && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-glass-border">
          <input
            value={depositAmount}
            onChange={(e) => {
              e.stopPropagation();
              setDepositAmount(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            type="text"
            className="bg-white/5 border border-glass-border px-3 py-1.5 rounded text-xs text-white font-mono max-w-[80px] focus:outline-none"
          />
          <span className="text-xs font-mono text-zinc-500">USDC</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeposit();
            }}
            disabled={actionLoading}
            className="text-xs px-4 py-1.5 rounded bg-success-emerald hover:bg-success-emerald/90 text-white font-bold transition-all ml-auto"
          >
            Fund Vault
          </button>
        </div>
      )}
    </div>
  );
}
