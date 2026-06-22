"use client";

import React from "react";
import { OnChainAgent } from "../../hooks/use-agent-state";
import { TxHistoryItem } from "../../hooks/use-simulator-state";

interface PerformanceTelemetryProps {
  agents: OnChainAgent[];
  txHistory: TxHistoryItem[];
  simulationMode: boolean;
}

export default function PerformanceTelemetry({
  agents,
  txHistory,
  simulationMode,
}: PerformanceTelemetryProps) {
  const totalDeposited = agents.reduce((acc, a) => acc + (a.balance || 0), 0);
  const sweepEvents = txHistory.filter((t) => t.type === "Agent Spend Payout");
  const totalSpends = sweepEvents.length;
  const latestSweepTs = sweepEvents[0]?.timestamp ?? 0;
  const recentSpends = sweepEvents.filter((t) => latestSweepTs - t.timestamp < 300_000).length;
  const spendVelocity = (recentSpends / 5).toFixed(1);

  const setupEvents = txHistory.length;
  const failedEvents = txHistory.filter((t) => t.status === "failed").length;
  const confirmedEvents = txHistory.filter((t) => t.status === "confirmed").length;
  const successRate = setupEvents > 0 ? ((confirmedEvents / setupEvents) * 100).toFixed(0) : "--";
  const successRateNumber = setupEvents > 0 ? Number(successRate) : 0;

  return (
    <div className="w-full glass-panel p-5 rounded-xl border border-glass-border bg-black/45 shadow-2xl flex flex-col gap-4">
      {/* Header section */}
      <div className="flex items-center justify-between pb-3 border-b border-glass-border/30">
        <div>
          <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <span className="text-success-emerald animate-pulse">📈</span> SYSTEM ACTIVITY & STATS
          </h4>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Live tracking of agent activity, vault reserves, and transaction success rates.
          </p>
        </div>
      </div>

      {/* Gauges rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Spend Velocity Gauge */}
        <div className="p-4 bg-black/35 rounded-lg border border-glass-border/20 flex flex-col gap-1.5 text-center relative overflow-hidden">
          <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold text-left block">⚡ Spending Speed</span>
          <div className="flex items-center justify-center py-2">
            <div className="relative w-24 h-12 flex items-end justify-center overflow-hidden">
              {/* Semi-circle visual gauge */}
              <div className="absolute inset-0 border-[7px] border-zinc-800 rounded-full" />
              <div
                className="absolute inset-0 border-[7px] border-success-emerald rounded-full transition-transform duration-500"
                style={{
                  clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)",
                  transform: `rotate(${Math.min((parseFloat(spendVelocity) / 5) * 180, 180)}deg)`
                }}
              />
              <span className="font-mono text-sm font-bold text-white absolute bottom-1">
                {spendVelocity} <span className="text-[8px] text-zinc-400">spm</span>
              </span>
            </div>
          </div>
          <span className="text-[8px] font-mono text-zinc-400">Requests per minute (last 5m)</span>
        </div>

        {/* Fleet Token Throughput */}
        <div className="p-4 bg-black/35 rounded-lg border border-glass-border/20 flex flex-col justify-between gap-3">
          <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold">💰 Funds & Transactions</span>
          
          <div className="grid grid-cols-2 gap-4 mt-1 font-mono">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold">Safe Balance</span>
              <span className="text-sm font-bold text-white">${totalDeposited.toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold">Payments Made</span>
              <span className="text-sm font-bold text-vivid-cyan">{totalSpends}</span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-gradient-to-r from-success-emerald to-emerald-600 rounded-full"
              style={{ width: `${Math.min((totalDeposited / 100) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Success Clearance Gauge */}
        <div className="p-4 bg-black/35 rounded-lg border border-glass-border/20 flex flex-col gap-1.5 text-center relative overflow-hidden">
          <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold text-left block">✅ Approved Transactions</span>
          <div className="flex items-center justify-center py-2">
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-black/45 border-4 border-zinc-800">
              {/* Radial success circle */}
                <div
                  className="absolute inset-0 rounded-full border-4 border-success-emerald opacity-60 animate-ping pointer-events-none"
                  style={{ clipPath: `polygon(50% 50%, -50% -50%, ${successRateNumber}% -50%)` }}
                />
              <span className="font-mono text-base font-bold text-white">
                {successRate}%
              </span>
            </div>
          </div>
          <span className="text-[8px] font-mono text-zinc-400">Approved vs Blocked Ratio</span>
          <span className="text-[8px] font-mono text-zinc-500">Confirmed: {confirmedEvents} | Failed: {failedEvents}</span>
        </div>
      </div>

      {/* Transaction explorer link drawer */}
      <div className="flex flex-col gap-2 mt-2">
        <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold tracking-wider">Transaction History Log</span>
        
        {txHistory.length === 0 ? (
          <div className="p-4 bg-black/30 border border-glass-border/20 rounded text-center font-mono text-[10px] text-zinc-500">
            📡 Awaiting transactions to show in history.
          </div>
        ) : (
          <div className="w-full max-h-[350px] overflow-y-auto bg-black/30 border border-glass-border/20 rounded font-mono text-[10px] scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-zinc-500 text-[8px] uppercase tracking-wider border-b border-glass-border/20">
                  <th className="p-2">Operation</th>
                  <th className="p-2">Target</th>
                  <th className="p-2">Mode</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Delta</th>
                  <th className="p-2">Time</th>
                  <th className="p-2 text-right">View Transaction</th>
                </tr>
              </thead>
              <tbody>
                {txHistory.map((tx, idx) => (
                  <tr key={idx} className="border-b border-glass-border/10 hover:bg-white/[0.01]">
                    <td className="p-2 font-bold text-white">{tx.type}</td>
                    <td className="p-2 text-zinc-400">
                      {tx.id !== undefined ? `Agent #${tx.id}` : "Global Safe"}
                      {tx.serverLabel ? <span className="text-zinc-500"> → {tx.serverLabel}</span> : null}
                    </td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase ${
                        tx.mode === "real"
                          ? "text-emerald-300 border-emerald-400/30 bg-emerald-500/10"
                          : "text-amber-300 border-amber-400/30 bg-amber-500/10"
                      }`}>
                        {tx.mode}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase ${
                        tx.status === "confirmed"
                          ? "text-emerald-300 border-emerald-400/30 bg-emerald-500/10"
                          : tx.status === "simulated"
                          ? "text-amber-300 border-amber-400/30 bg-amber-500/10"
                          : "text-rose-300 border-rose-400/30 bg-rose-500/10"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-2 text-zinc-300">
                      {typeof tx.delta === "number"
                        ? `${tx.delta > 0 ? "+" : ""}${tx.delta.toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="p-2 text-zinc-500">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-2 text-right">
                      {tx.signature && tx.mode === "real" ? (
                        <a
                          href={(() => {
                            const activeNetwork = typeof window !== "undefined" ? localStorage.getItem("solagent_network") : "devnet";
                            const clusterParam = activeNetwork === "localnet"
                              ? "cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899"
                              : "cluster=devnet";
                            return `https://explorer.solana.com/tx/${tx.signature}?${clusterParam}`;
                          })()}
                          target="_blank"
                          rel="noreferrer"
                          className="text-vivid-cyan hover:underline font-bold"
                        >
                          [🔍 Solana Explorer]
                        </a>
                      ) : (
                        <span className="text-zinc-600" title={tx.message || "No signature available"}>
                          {tx.status === "failed" ? "Preflight failed" : "No signature"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-[9px] text-zinc-500 font-mono">
        Live mode right now: <span className={simulationMode ? "text-amber-300" : "text-emerald-300"}>
          {simulationMode ? "Simulation" : "Real On-Chain"}
        </span>
      </p>
    </div>
  );
}
