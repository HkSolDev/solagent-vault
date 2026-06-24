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
        <div className="p-5 bg-black/40 rounded-xl border border-glass-border/20 flex flex-col justify-between gap-3 text-center relative overflow-hidden backdrop-blur-md hover:border-glass-border/40 transition-colors duration-300">
          <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold text-left block tracking-wider">⚡ Spending Speed</span>
          
          <div className="flex flex-col items-center justify-center py-2 relative">
            <svg className="w-24 h-12" viewBox="0 0 100 50">
              <path
                d="M 10 45 A 40 40 0 0 1 90 45"
                fill="none"
                stroke="#1f1f22"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M 10 45 A 40 40 0 0 1 90 45"
                fill="none"
                stroke="url(#speedGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="125.66"
                strokeDashoffset={125.66 - (125.66 * Math.min(parseFloat(spendVelocity) / 5, 1))}
                className="transition-[stroke-dashoffset] duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-2 flex flex-col items-center">
              <span className="font-mono text-base font-extrabold text-white tracking-tight leading-none">
                {spendVelocity}
              </span>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">spm</span>
            </div>
          </div>
          
          <span className="text-[9px] font-mono text-zinc-500">Requests per minute (last 5m)</span>
        </div>
 
        {/* Fleet Token Throughput */}
        <div className="p-5 bg-black/40 rounded-xl border border-glass-border/20 flex flex-col justify-between gap-4 backdrop-blur-md hover:border-glass-border/40 transition-colors duration-300">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">💰 Funds & Transactions</span>
          
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-semibold font-mono">Safe Balance</span>
              <span className="text-base font-extrabold text-white font-mono tracking-tight leading-snug">
                ${totalDeposited.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 text-right border-l border-zinc-800/50 pl-4">
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-semibold font-mono">Payments Made</span>
              <span className="text-base font-extrabold text-cyan-400 font-mono leading-snug">
                {totalSpends}
              </span>
            </div>
          </div>
 
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between text-[8px] font-mono text-zinc-500">
              <span className="tracking-widest">RESERVE CAPACITY</span>
              <span>{Math.min((totalDeposited / 1000000) * 100, 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((totalDeposited / 1000000) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
 
        {/* Success Clearance Gauge */}
        <div className="p-5 bg-black/40 rounded-xl border border-glass-border/20 flex flex-col justify-between gap-3 text-center relative overflow-hidden backdrop-blur-md hover:border-glass-border/40 transition-colors duration-300">
          <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold text-left block tracking-wider">✅ Approved Transactions</span>
          
          <div className="flex items-center justify-center py-1 relative">
            <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r="24"
                fill="none"
                stroke="#1f1f22"
                strokeWidth="4.5"
              />
              <circle
                cx="30"
                cy="30"
                r="24"
                fill="none"
                stroke="url(#successGradient)"
                strokeWidth="4.5"
                strokeDasharray="150.8"
                strokeDashoffset={isNaN(successRateNumber) ? 150.8 : 150.8 - (150.8 * successRateNumber) / 100}
                strokeLinecap="round"
                className="transition-[stroke-dashoffset] duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-mono text-sm font-extrabold text-white">
                {successRate}%
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-mono text-zinc-400 tracking-wider">Approved vs Blocked Ratio</span>
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-semibold">
              Confirmed: <span className="text-emerald-400">{confirmedEvents}</span> | Failed: <span className="text-rose-400">{failedEvents}</span>
            </span>
          </div>
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
                            return `https://orbmarkets.io/tx/${tx.signature}`;
                          })()}
                          target="_blank"
                          rel="noreferrer"
                          className="text-vivid-cyan hover:underline font-bold"
                        >
                          [🔍 orbmarkets.io]
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
