"use client";

import React, { useMemo, useState } from "react";
import { OnChainAgent } from "../../hooks/use-agent-state";

interface DataFeedItem {
  timestamp: number;
  agentId: number;
  feedType: string;
  payload: string;
  cost: number;
  size: number;
  serverLabel?: string;
  providerLabel?: string;
}

interface DataStreamLedgerProps {
  agents: OnChainAgent[];
  dataFeeds: DataFeedItem[];
}

export default function DataStreamLedger({ agents, dataFeeds }: DataStreamLedgerProps) {
  // Modal tracking state for detailed visual payload inspection
  const [selectedFeed, setSelectedFeed] = useState<DataFeedItem | null>(null);

  // Aggregate stats: spent cost and throughput bytes consumed per agent
  const aggregationMap = useMemo(() => {
    const map: Record<number, { spent: number; requests: number; bytes: number }> = {};
    
    // Seed with all spawned agents
    agents.forEach(a => {
      map[a.id] = { spent: 0, requests: 0, bytes: 0 };
    });

    // Accumulate feeds
    dataFeeds.forEach(feed => {
      if (map[feed.agentId]) {
        map[feed.agentId].spent += feed.cost;
        map[feed.agentId].requests += 1;
        map[feed.agentId].bytes += feed.size;
      } else {
        // Fallback for custom nodes
        map[feed.agentId] = { spent: feed.cost, requests: 1, bytes: feed.size };
      }
    });

    return map;
  }, [agents, dataFeeds]);

  // Total system consumption
  const totalVolume = dataFeeds.reduce((acc, f) => acc + f.size, 0);
  const totalSpent = dataFeeds.reduce((acc, f) => acc + f.cost, 0);

  return (
    <div className="w-full glass-panel p-5 rounded-xl border border-glass-border bg-black/45 shadow-2xl flex flex-col gap-5">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-glass-border/30">
        <div>
          <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <span className="text-success-emerald animate-pulse">🛰️</span> INFERENCE SERVER ROUTING: DATA CONSUMPTION LEDGER
          </h4>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Bilateral client-to-backend socket channels tracking on-chain micro-payments and decrypted datasets.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
            SOCKET: WS://SOLAGENT.IO
          </span>
          <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded bg-success-emerald/10 border border-success-emerald/20 text-success-emerald animate-pulse">
            SERVER: ONLINE
          </span>
        </div>
      </div>

      {/* Grid: 1. Connections Status  &  2. Aggregate Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col: Bilateral Sockets Visualizer */}
        <div className="lg:col-span-5 p-3.5 bg-black/35 rounded-lg border border-glass-border/20 flex flex-col gap-3 font-mono">
          <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Client-Backend Bilateral Connections</span>
          
          {agents.length === 0 ? (
            <div className="text-center text-[10px] text-zinc-500 py-10">
              No spawned Agent PDAs to connect.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
              {agents.map((agent) => {
                const hasFeeds = aggregationMap[agent.id]?.requests > 0;
                const isActive = agent.status === "Active" && agent.balance > 0;
                
                return (
                  <div key={agent.id} className="flex items-center justify-between p-2 bg-black/20 border border-glass-border/10 rounded hover:border-glass-border/30 transition-all text-[9px]">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-success-emerald animate-pulse" : agent.balance <= 0 ? "bg-amber-500" : "bg-red-500"}`} />
                      <span className="text-white font-bold">Agent #{agent.id}</span>
                      <span className="text-zinc-500">↔</span>
                      <span className="text-zinc-400">
                        {dataFeeds.find((f) => f.agentId === agent.id)?.serverLabel || "No server route yet"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasFeeds ? (
                        <span className="text-[7px] text-vivid-cyan px-1.5 py-0.5 bg-vivid-cyan/10 border border-vivid-cyan/20 rounded font-black tracking-widest uppercase animate-pulse">
                          STREAMING
                        </span>
                      ) : (
                        <span className="text-[7px] text-zinc-600 px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-black tracking-widest uppercase">
                          STANDBY
                        </span>
                      )}
                      <span className="text-zinc-500 text-[8px] font-black">
                        {(aggregationMap[agent.id]?.spent || 0).toFixed(2)} SOLAGNT
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Aggregate Consumption Details */}
        <div className="lg:col-span-7 p-3.5 bg-black/35 rounded-lg border border-glass-border/20 flex flex-col gap-3 font-mono">
          <div className="flex justify-between items-center text-[8px] text-zinc-500 uppercase font-bold tracking-wider">
            <span>Data Consumption Breakdown Ledger</span>
            <span className="text-success-emerald font-black">⚡ Cumulative Payload Stream</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-black/25 border border-glass-border/10 rounded flex flex-col gap-0.5">
              <span className="text-[7px] text-zinc-500 uppercase">Decrypted Packets Volume</span>
              <span className="text-sm font-bold text-white flex items-baseline gap-1 mt-0.5">
                {totalVolume} <span className="text-[8px] text-zinc-400 font-normal">Bytes</span>
              </span>
            </div>
            <div className="p-2.5 bg-black/25 border border-glass-border/10 rounded flex flex-col gap-0.5">
              <span className="text-[7px] text-zinc-500 uppercase">Paid Budget Clearance</span>
              <span className="text-sm font-bold text-vivid-cyan flex items-baseline gap-1 mt-0.5">
                ${totalSpent.toFixed(2)} <span className="text-[8px] text-zinc-400 font-normal">SOLAGNT</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <span className="text-[7px] text-zinc-500 uppercase font-bold">Volume Contribution share</span>
            {agents.length === 0 ? (
              <div className="text-[8px] text-zinc-500 text-center py-2">No data transferred.</div>
            ) : (
              <div className="w-full flex h-2.5 bg-zinc-800 rounded overflow-hidden">
                {agents.map((agent, idx) => {
                  const bytes = aggregationMap[agent.id]?.bytes || 0;
                  const pct = totalVolume > 0 ? (bytes / totalVolume) * 100 : 0;
                  
                  const colors = ["#a855f7", "#06b6d4", "#10b981", "#eab308", "#3b82f6", "#f43f5e"];
                  const color = colors[idx % colors.length];

                  if (pct === 0) return null;
                  
                  return (
                    <div
                      key={agent.id}
                      style={{ width: `${pct}%`, backgroundColor: color }}
                      className="h-full first:rounded-l last:rounded-r transition-all duration-500"
                      title={`Agent #${agent.id}: ${bytes} Bytes (${pct.toFixed(0)}%)`}
                    />
                  );
                })}
              </div>
            )}
            
            {/* Small Legend indicators */}
            <div className="flex flex-wrap gap-2 text-[8px] text-zinc-400 mt-1">
              {agents.map((agent, idx) => {
                const bytes = aggregationMap[agent.id]?.bytes || 0;
                const colors = ["#a855f7", "#06b6d4", "#10b981", "#eab308", "#3b82f6", "#f43f5e"];
                const color = colors[idx % colors.length];
                
                return (
                  <div key={agent.id} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <span>Agent #{agent.id} ({bytes} B)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Live Decrypted Data Packets Streaming Grid Table */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold tracking-wider">Live Decrypted HTTP 402 Paywall Payload logs</span>
        
        {dataFeeds.length === 0 ? (
          <div className="p-6 bg-black/30 border border-glass-border/20 rounded text-center font-mono text-[10px] text-zinc-500 select-none">
            📡 Awaiting paywall spend confirmation. Decrypted premium feeds will stream here in real time.
          </div>
        ) : (
          <div className="w-full max-h-[180px] overflow-y-auto bg-black/30 border border-glass-border/20 rounded font-mono text-[10px] scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-zinc-500 text-[8px] uppercase tracking-wider border-b border-glass-border/20">
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Origin Client</th>
                  <th className="p-2.5">Server</th>
                  <th className="p-2.5">Feed Type</th>
                  <th className="p-2.5">Cost</th>
                  <th className="p-2.5">Decrypted Payload Content Stream</th>
                  <th className="p-2.5 text-right">Packet Size</th>
                </tr>
              </thead>
              <tbody>
                {dataFeeds.map((feed, idx) => (
                  <tr key={idx} className="border-b border-glass-border/10 hover:bg-white/[0.01] transition-all duration-300 group">
                    <td className="p-2.5 text-zinc-500 whitespace-nowrap">
                      {new Date(feed.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-2.5">
                      <span className="text-electric-purple font-bold">Agent #{feed.agentId}</span>
                    </td>
                    <td className="p-2.5 text-zinc-400">
                      {feed.serverLabel || "Unknown"}
                      {feed.providerLabel ? (
                        <span className="text-zinc-500"> ({String(feed.providerLabel).toUpperCase()})</span>
                      ) : null}
                    </td>
                    <td className="p-2.5">
                      <span className="text-vivid-cyan bg-vivid-cyan/5 border border-vivid-cyan/10 px-1.5 py-0.5 rounded font-black text-[8px]">
                        {feed.feedType}
                      </span>
                    </td>
                    <td className="p-2.5 text-white font-bold">
                      ${feed.cost.toFixed(2)} SOL
                    </td>
                    <td className="p-2.5 font-mono text-[9px] text-success-emerald group-hover:text-emerald-400 transition-colors">
                      <div
                        onClick={() => setSelectedFeed(feed)}
                        className="max-w-[420px] overflow-hidden text-ellipsis whitespace-nowrap bg-black/50 px-2 py-1 rounded border border-glass-border/20 select-all font-bold tracking-tight cursor-pointer hover:border-success-emerald/50 transition-colors"
                        title="Click to expand full decrypted JSON dataset"
                      >
                        {feed.payload}
                      </div>
                    </td>
                    <td className="p-2.5 text-right text-zinc-400 whitespace-nowrap">
                      {feed.size} Bytes
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sleek High-Fidelity Decrypted Payload Viewer Modal Overlay */}
      {selectedFeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-electric-purple/35 bg-zinc-950/95 shadow-2xl flex flex-col gap-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-glass-border/30">
              <div className="flex items-center gap-2">
                <span className="text-success-emerald text-base animate-pulse">🔓</span>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  DECRYPTED PAYLOAD VIEWER: AGENT #{selectedFeed.agentId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFeed(null)}
                className="text-zinc-500 hover:text-white font-mono text-xs cursor-pointer p-1 transition-colors"
              >
                [ESC / CLOSE]
              </button>
            </div>

            {/* Meta details list */}
            <div className="grid grid-cols-2 gap-2.5 text-[9px] font-mono text-zinc-400 uppercase font-bold">
              <div className="p-2 bg-black/45 border border-glass-border/20 rounded">
                Feed Type: <span className="text-vivid-cyan">{selectedFeed.feedType}</span>
              </div>
              <div className="p-2 bg-black/45 border border-glass-border/20 rounded">
                Budget Paid: <span className="text-white">${selectedFeed.cost.toFixed(2)} SOLAGNT</span>
              </div>
              <div className="p-2 bg-black/45 border border-glass-border/20 rounded">
                Packet Size: <span className="text-white">{selectedFeed.size} Bytes</span>
              </div>
              <div className="p-2 bg-black/45 border border-glass-border/20 rounded">
                Decrypted Time: <span className="text-white">{new Date(selectedFeed.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Formatted JSON Panel */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[8px] font-mono text-zinc-500 uppercase font-bold">Raw JSON Packet Content</span>
              <div className="w-full max-h-[200px] overflow-y-auto bg-black/60 border border-glass-border/30 p-3.5 rounded-lg text-[9px] font-mono text-zinc-300 leading-relaxed scrollbar-thin select-all">
                {(() => {
                  try {
                    const parsed = JSON.parse(selectedFeed.payload);
                    return (
                      <pre className="text-success-emerald font-bold whitespace-pre-wrap">
                        {JSON.stringify(parsed, null, 2)}
                      </pre>
                    );
                  } catch (e) {
                    return <pre className="text-success-emerald font-bold">{selectedFeed.payload}</pre>;
                  }
                })()}
              </div>
            </div>

            {/* Quick Copy / Close controls */}
            <div className="flex gap-3 justify-end font-mono text-[9px] mt-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedFeed.payload);
                }}
                className="px-3.5 py-1.5 rounded border border-vivid-cyan/35 hover:bg-vivid-cyan/15 text-vivid-cyan cursor-pointer transition-all font-bold"
              >
                📋 COPY RAW JSON
              </button>
              <button
                onClick={() => setSelectedFeed(null)}
                className="px-3.5 py-1.5 rounded bg-electric-purple hover:bg-purple-600 text-white cursor-pointer transition-all font-bold"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
