"use client";

import React, { useMemo, useState } from "react";
import { OnChainAgent } from "../../hooks/use-agent-state";
import { TxHistoryItem } from "../../hooks/use-simulator-state";

interface FleetGridProps {
  agents: OnChainAgent[];
  activeAgentId: number;
  onSelectAgent: (id: number) => void;
  onTogglePause: (agent: OnChainAgent) => Promise<void>;
  onDeposit: (id: number, amount: string) => Promise<void>;
  onWithdraw: (id: number, amount: string) => Promise<void>;
  onCloseAgent: (id: number) => Promise<void>;
  onLiveAISolveForAgent: (id: number) => void;
  onBatchRunSolvers: () => void;
  onEmergencyFleetFreeze: () => Promise<void>;
  onCloseAllAgents: () => Promise<void>;
  actionLoading: boolean;
  walletAddress: string;
  solBalance: number | null;
  txHistory: TxHistoryItem[];
  onDeployNewAgent: () => void;
}

function shortAddress(address: string) {
  if (!address) return "Not connected";
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatAmount(value: number, decimals = 2) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCardAmount(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 100_000) return `${(value / 1_000).toFixed(1)}K`;
  return formatAmount(value);
}

function getAgentAvatar(id: number) {
  const avatars = ["🤖", "🧠", "🛡️", "⚡", "🛰️", "🦾"];
  return avatars[id % avatars.length];
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
  walletAddress,
  solBalance,
  txHistory,
  onDeployNewAgent,
}: FleetGridProps) {
  const [depositAmounts, setDepositAmounts] = useState<Record<number, string>>({});

  const activeAgents = useMemo(() => agents.filter((a) => a.status === "Active"), [agents]);
  const activeWithFunds = useMemo(() => agents.filter((a) => a.status === "Active" && a.balance > 0), [agents]);
  const totalBalance = useMemo(() => agents.reduce((acc, a) => acc + a.balance, 0), [agents]);
  const totalTx = txHistory.length;
  const successTx = txHistory.filter((t) => t.status === "confirmed").length;
  const successRate = totalTx > 0 ? Math.round((successTx / totalTx) * 100) : 0;
  const topRows = txHistory.slice(0, 5);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7 glass-card rounded-xl border border-glass-border/50 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-r border-glass-border/40 pr-4">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-bold">Wallet Connection</p>
              <p className="mt-1 text-vivid-cyan font-mono text-sm font-bold">{shortAddress(walletAddress)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-bold">Total Vault Balance</p>
              <p className="mt-1 text-white font-mono text-sm font-bold">{formatAmount(solBalance ?? 0)} SOL</p>
            </div>
          </div>
        </div>
        <div className="xl:col-span-5 flex items-center justify-end">
          <button
            onClick={onDeployNewAgent}
            className="px-6 py-3 rounded-xl bg-primary-container text-on-primary-container font-bold text-sm shadow-[0_0_20px_rgba(0,242,255,0.25)] hover:opacity-95 transition-all cursor-pointer"
          >
            + New Agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl border border-glass-border/40 p-5">
          <p className="text-zinc-300 text-sm">Active Agents</p>
          <p className="mt-1 text-primary text-4xl font-mono font-bold">{String(activeAgents.length).padStart(2, "0")}</p>
          <p className="mt-2 text-success-emerald text-sm font-semibold">↗ 100% Uptime</p>
        </div>
        <div className="glass-card rounded-xl border border-glass-border/40 p-5">
          <p className="text-zinc-300 text-sm">24h Transactions</p>
          <p className="mt-1 text-white text-4xl font-mono font-bold">{formatAmount(totalTx, 0)}</p>
          <p className="mt-2 text-vivid-cyan text-sm font-semibold">↔ Last: {topRows[0] ? new Date(topRows[0].timestamp).toLocaleTimeString() : "--"}</p>
        </div>
        <div className="glass-card rounded-xl border border-glass-border/40 p-5">
          <p className="text-zinc-300 text-sm">Security Score</p>
          <p className="mt-1 text-success-emerald text-4xl font-mono font-bold">{successRate}%</p>
          <p className="mt-2 text-zinc-400 text-sm">Policy Guardrails Active</p>
        </div>
        <div className="glass-card rounded-xl border border-glass-border/40 p-5">
          <p className="text-zinc-300 text-sm">Fleet Balance</p>
          <p className="mt-1 text-white text-4xl font-mono font-bold tracking-tight">{formatAmount(totalBalance)} SOL</p>
          <p className="mt-2 text-success-emerald text-sm">Active-funded: {activeWithFunds.length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-display font-bold text-white">Agent Fleet</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onBatchRunSolvers}
            disabled={actionLoading || agents.length === 0}
            className="px-4 py-2 rounded-lg border border-primary/25 bg-surface-container-high/70 text-zinc-200 text-sm font-semibold cursor-pointer disabled:opacity-40"
          >
            Start All
          </button>
          <button
            onClick={onEmergencyFleetFreeze}
            disabled={actionLoading || activeWithFunds.length === 0}
            className="px-4 py-2 rounded-lg border border-primary/25 bg-surface-container-high/70 text-amber-300 text-sm font-semibold cursor-pointer disabled:opacity-40"
          >
            Freeze
          </button>
          <button
            onClick={onCloseAllAgents}
            disabled={actionLoading || agents.length === 0}
            className="px-4 py-2 rounded-lg border border-primary/25 bg-surface-container-high/70 text-rose-300 text-sm font-semibold cursor-pointer disabled:opacity-40"
          >
            Delete All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const isSelected = activeAgentId === agent.id;
          const currentDepositVal = depositAmounts[agent.id] !== undefined ? depositAmounts[agent.id] : "1000.0";
          const isFundedActive = agent.status === "Active" && agent.balance > 0;
          const statusLabel = isFundedActive ? "ACTIVE" : agent.status === "Paused" ? "PAUSED" : "UNFUNDED";

          return (
            <div
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className={`glass-card rounded-2xl border p-5 transition-all cursor-pointer ${
                isSelected ? "border-primary/40 shadow-[0_0_24px_rgba(0,242,255,0.12)]" : "border-primary/15"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-full border border-primary/40 bg-surface-container-low flex items-center justify-center text-lg shadow-[0_0_16px_rgba(0,242,255,0.16)]">
                    {getAgentAvatar(agent.id)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[24px] md:text-[28px] leading-none font-display font-bold text-white tracking-tight">Agent #{String(agent.id).padStart(3, "0")}</h4>
                    <span className={`px-2 py-1 rounded border text-[11px] font-bold tracking-wider ${
                      statusLabel === "ACTIVE"
                        ? "text-success-emerald border-success-emerald/30 bg-success-emerald/10"
                        : statusLabel === "PAUSED"
                        ? "text-zinc-300 border-zinc-500/30 bg-zinc-500/10"
                        : "text-amber-300 border-amber-400/30 bg-amber-500/10"
                    }`}>
                      {statusLabel}
                    </span>
                    </div>
                    <p className="mt-1 text-zinc-400 font-mono text-xs">PDA: {shortAddress(agent.publicKey)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="h-9 w-9 rounded-lg border border-primary/20 bg-surface-container-high/70 text-zinc-400 hover:text-zinc-200 transition-colors cursor-default"
                  aria-label="Agent options"
                >
                  ⋮
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl border border-primary/20 bg-surface-container-low/85 px-4 py-3">
                  <p className="text-[11px] font-mono uppercase text-zinc-500">Vault Balance</p>
                  <p
                    className="text-[32px] leading-[1] mt-1 font-mono font-bold text-primary tracking-tight whitespace-nowrap"
                    title={`${formatAmount(agent.balance)} SOL`}
                  >
                    {formatCardAmount(agent.balance)}
                  </p>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mt-1">SOL</p>
                </div>
                <div className="rounded-xl border border-primary/20 bg-surface-container-low/85 px-4 py-3">
                  <p className="text-[11px] font-mono uppercase text-zinc-500">Tx Cap (Limit)</p>
                  <p
                    className="text-[32px] leading-[1] mt-1 font-mono font-bold text-white tracking-tight whitespace-nowrap"
                    title={`${formatAmount(agent.maxPerCall)} SOL`}
                  >
                    {formatCardAmount(agent.maxPerCall)}
                  </p>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mt-1">SOL</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,0.86fr)_44px] gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeposit(agent.id, currentDepositVal);
                  }}
                  disabled={actionLoading}
                  className="h-11 rounded-xl bg-primary-container text-on-primary-container font-bold text-sm cursor-pointer disabled:opacity-50"
                >
                  ◉ Fund Agent
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePause(agent);
                  }}
                  disabled={actionLoading}
                  className="h-11 rounded-xl border border-primary/25 bg-surface-container-high/70 text-zinc-200 font-bold text-sm cursor-pointer disabled:opacity-50"
                >
                  {agent.status === "Active" ? "▮▮ Pause" : "▶ Resume"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseAgent(agent.id);
                  }}
                  disabled={actionLoading}
                  className="h-11 w-11 rounded-xl border border-primary/25 bg-surface-container-high/70 text-rose-300 font-bold text-base cursor-pointer disabled:opacity-50"
                  aria-label={`Delete Agent ${agent.id}`}
                >
                  ↪
                </button>
              </div>

              <div className="mt-2 grid grid-cols-[1fr_auto_auto] gap-2">
                <input
                  type="text"
                  value={currentDepositVal}
                  onChange={(e) => {
                    e.stopPropagation();
                    setDepositAmounts((prev) => ({ ...prev, [agent.id]: e.target.value }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-10 rounded-lg px-3 border border-primary/25 bg-surface-container-low text-sm font-mono text-white focus:outline-none focus:border-primary-container"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWithdraw(agent.id, agent.balance.toString());
                  }}
                  disabled={actionLoading || agent.balance <= 0}
                  className="h-10 px-4 rounded-lg border border-primary/25 bg-surface-container-high/70 text-zinc-200 text-sm font-semibold cursor-pointer disabled:opacity-40"
                >
                  Withdraw
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLiveAISolveForAgent(agent.id);
                  }}
                  disabled={actionLoading || !isFundedActive}
                  className="h-10 px-4 rounded-lg border border-primary/25 bg-surface-container-high/70 text-primary-container text-sm font-semibold cursor-pointer disabled:opacity-40"
                >
                  Run
                </button>
              </div>
            </div>
          );
        })}

        {agents.length === 0 && (
          <button
            onClick={onDeployNewAgent}
            className="glass-card rounded-xl border border-primary/30 border-dashed p-10 min-h-[320px] flex flex-col items-center justify-center text-center hover:border-primary/60 transition-all cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-primary/15 text-primary text-5xl flex items-center justify-center">+</div>
            <h4 className="mt-4 text-2xl font-display font-bold text-white">Deploy New Agent</h4>
            <p className="mt-2 text-zinc-400 max-w-xs">
              Initialize a new autonomous agent with a dedicated PDA vault.
            </p>
          </button>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-display font-bold text-white">Recent Fleet Activity</h3>
        </div>
        <div className="glass-card rounded-xl border border-primary/15 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className="text-left p-4 text-[11px] uppercase font-mono tracking-wider text-zinc-500">Time</th>
                <th className="text-left p-4 text-[11px] uppercase font-mono tracking-wider text-zinc-500">Agent</th>
                <th className="text-left p-4 text-[11px] uppercase font-mono tracking-wider text-zinc-500">Action</th>
                <th className="text-left p-4 text-[11px] uppercase font-mono tracking-wider text-zinc-500">Amount</th>
                <th className="text-left p-4 text-[11px] uppercase font-mono tracking-wider text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {topRows.length === 0 ? (
                <tr>
                  <td className="p-6 text-zinc-500 font-mono text-sm" colSpan={5}>
                    No activity yet. Run your first agent action to populate this log.
                  </td>
                </tr>
              ) : (
                topRows.map((tx, idx) => (
                  <tr key={idx} className="border-t border-primary/10">
                    <td className="p-4 font-mono text-zinc-300">{new Date(tx.timestamp).toLocaleTimeString()}</td>
                    <td className="p-4 font-display text-white font-bold">{tx.id !== undefined ? `Agent #${String(tx.id).padStart(3, "0")}` : "Global"}</td>
                    <td className="p-4 text-zinc-300">{tx.type}</td>
                    <td className="p-4 font-mono text-primary">{typeof tx.delta === "number" ? `${formatAmount(tx.delta)} SOL` : "--"}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded border text-xs font-semibold ${
                        tx.status === "confirmed"
                          ? "text-success-emerald border-success-emerald/30 bg-success-emerald/10"
                          : tx.status === "failed"
                          ? "text-emergency-red border-emergency-red/30 bg-emergency-red/10"
                          : "text-amber-300 border-amber-300/30 bg-amber-300/10"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
