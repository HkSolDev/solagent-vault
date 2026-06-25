"use client";

import React from "react";
import { OnChainAgent } from "../../hooks/use-agent-state";

interface ServerNode {
  id: string;
  label: string;
  requests: number;
  status: "active" | "idle";
}

interface FleetTopologyMapProps {
  agents: OnChainAgent[];
  activeAgentId: number;
  solverState: string;
  agentSolverStates?: Record<number, string>;
  serverNodes: ServerNode[];
  onSelectAgent: (id: number) => void;
}

export default function FleetTopologyMap({
  agents,
  activeAgentId,
  solverState,
  agentSolverStates,
  serverNodes,
  onSelectAgent,
}: FleetTopologyMapProps) {
  const cx = 250;
  const cy = 180;

  const getAgentCoords = (index: number, total: number) => {
    if (total === 1) return { x: cx - 120, y: cy };
    const angleStart = Math.PI * 0.5;
    const angleEnd = Math.PI * 1.5;
    const angleStep = total > 1 ? (angleEnd - angleStart) / (total - 1) : 0;
    const angle = angleStart + index * angleStep;
    const radius = 110;
    return {
      x: Math.round(cx + radius * Math.cos(angle)),
      y: Math.round(cy + radius * Math.sin(angle)),
    };
  };

  const getServerCoords = (index: number, total: number) => {
    const startY = 110;
    const spacing = total > 1 ? 150 / (total - 1) : 0;
    return { x: 430, y: Math.round(startY + index * spacing) };
  };

  const isTransferring =
    solverState === "signing" ||
    solverState === "done" ||
    (agentSolverStates && Object.values(agentSolverStates).some((s) => s === "signing" || s === "done"));

  return (
    <div className="w-full glass-panel rounded-xl border border-primary/15 flex flex-col bg-black/45 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-primary/10 bg-surface-container/45">
        <div className="flex items-center gap-2.5">
          <span className="text-vivid-cyan">✣</span>
          <h4 className="text-xl font-display font-bold text-zinc-100">Interactive Fleet Topology</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-primary/20 bg-surface-container-high/70 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">
            Auto-Scaling: ON
          </span>
          <span className="rounded-full border border-primary/20 bg-surface-container-high/70 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">
            Latency: 42ms
          </span>
        </div>
      </div>

      <div className="w-full relative flex items-center justify-center min-h-[430px] border border-primary/10 bg-[radial-gradient(ellipse_at_center,rgba(0,242,255,0.10),rgba(8,12,22,0.92)_45%,rgba(6,9,18,1)_80%)] rounded-b-xl p-2 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0,rgba(0,242,255,0.02)_50%,transparent_100%)] pointer-events-none" />

        {agents.length === 0 ? (
          <div className="text-center font-mono text-[11px] text-zinc-500 py-20">
            📡 No active nodes detected. Spawn Agent PDAs to render network cables.
          </div>
        ) : (
          <svg viewBox="0 0 500 360" className="w-full max-w-[500px] h-auto drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <defs>
              <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="data-beam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(6, 182, 212, 0.15)" />
                <stop offset="50%" stopColor="rgba(0, 242, 255, 0.75)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.15)" />
              </linearGradient>
            </defs>

            {/* Ambient motion layer */}
            <g opacity="0.45">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <circle key={`ambient-${i}`} r="1.8" fill="rgba(0,242,255,0.45)">
                  <animate
                    attributeName="opacity"
                    values="0.1;0.7;0.1"
                    dur={`${5 + i * 0.9}s`}
                    repeatCount="indefinite"
                  />
                  <animateMotion
                    path={`M ${80 + i * 55} ${70 + (i % 3) * 80} Q ${230 + i * 14} ${120 + (i % 2) * 120} ${380 + i * 8} ${80 + (i % 4) * 65}`}
                    dur={`${14 + i * 1.6}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>

            {agents.map((agent, i) => {
              const coords = getAgentCoords(i, agents.length);
              const isActive = activeAgentId === agent.id;
              const status = agentSolverStates ? agentSolverStates[agent.id] : isActive ? solverState : "idle";
              const isSending = status === "fetching" || status === "querying" || status === "signing";
              const isLinkActive = isActive || isSending || status === "done" || status === "error";

              return (
                <g key={`link-${agent.id}`}>
                  <line
                    x1={coords.x}
                    y1={coords.y}
                    x2={cx}
                    y2={cy}
                    stroke={isLinkActive ? "rgba(147, 51, 234, 0.4)" : "rgba(255, 255, 255, 0.04)"}
                    strokeWidth={isLinkActive ? 2.5 : 1}
                    strokeDasharray={isLinkActive ? "none" : "3, 3"}
                    className="transition-all duration-300"
                  />
                  {isLinkActive && (
                    <line
                      x1={coords.x}
                      y1={coords.y}
                      x2={cx}
                      y2={cy}
                      stroke="url(#data-beam)"
                      strokeWidth="1.25"
                      strokeDasharray="12 10"
                      opacity="0.85"
                    >
                      <animate attributeName="stroke-dashoffset" from="120" to="0" dur="2.6s" repeatCount="indefinite" />
                    </line>
                  )}
                  {isSending && (
                    <circle r="4" fill="#a855f7" filter="url(#glow-purple)">
                      <animateMotion path={`M ${coords.x} ${coords.y} L ${cx} ${cy}`} dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}

            {serverNodes.map((node, idx) => {
              const { x, y } = getServerCoords(idx, serverNodes.length);
              return (
                <line
                  key={`server-link-${node.id}`}
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke={node.status === "active" ? "rgba(6, 182, 212, 0.5)" : "rgba(255, 255, 255, 0.05)"}
                  strokeWidth={node.status === "active" ? 2.5 : 1}
                  className="transition-all duration-300"
                />
              );
            })}

            {agents.map((agent) => {
              const status = agentSolverStates ? agentSolverStates[agent.id] : activeAgentId === agent.id ? solverState : "idle";
              if (status !== "signing") return null;
              const target = getServerCoords(agent.id % Math.max(serverNodes.length, 1), Math.max(serverNodes.length, 1));
              return (
                <circle key={`pay-${agent.id}`} r="5" fill="#06b6d4" filter="url(#glow-cyan)">
                  <animateMotion path={`M ${cx} ${cy} L ${target.x} ${target.y}`} dur="1s" repeatCount="indefinite" />
                </circle>
              );
            })}

            {serverNodes.map((node, idx) => {
              const { x, y } = getServerCoords(idx, serverNodes.length);
              return (
                <g key={node.id} transform={`translate(${x}, ${y})`}>
                  <circle
                    r="20"
                    fill="#0f172a"
                    stroke={node.status === "active" ? "#06b6d4" : "#1e293b"}
                    strokeWidth="2"
                    filter={node.status === "active" ? "url(#glow-cyan)" : "none"}
                    className="transition-all duration-500"
                  />
                  {node.status === "active" && (
                    <circle r="23" fill="none" stroke="rgba(0,242,255,0.45)" strokeWidth="1.2" filter="url(#glow-cyan)">
                      <animate attributeName="r" values="22;27;22" dur="2.6s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.6s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text y="4" textAnchor="middle" className="text-[11px] select-none pointer-events-none">
                    🧠
                  </text>
                  <text y="29" textAnchor="middle" fill="#06b6d4" className="text-[6px] font-mono font-bold select-none pointer-events-none">
                    {node.label.slice(0, 14)}
                  </text>
                  <text y="37" textAnchor="middle" fill="#94a3b8" className="text-[6px] font-mono select-none pointer-events-none">
                    {node.requests} req
                  </text>
                </g>
              );
            })}

            <g transform={`translate(${cx}, ${cy})`}>
              <circle r="30" fill="#0f172a" stroke="#eab308" strokeWidth="2.5" className="shadow-2xl" />
              <circle r="43" fill="none" stroke="rgba(0,242,255,0.22)" strokeWidth="1.1">
                <animate attributeName="r" values="40;48;40" dur="3.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.1;0.8" dur="3.2s" repeatCount="indefinite" />
              </circle>
              <circle r="35" fill="none" stroke="rgba(234, 179, 8, 0.2)" strokeWidth="1.5" strokeDasharray="10, 15">
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite" />
              </circle>
              <text y="5" textAnchor="middle" className="text-[16px] select-none pointer-events-none">
                💰
              </text>
              <text y="42" textAnchor="middle" fill="#eab308" className="text-[8px] font-mono font-bold uppercase tracking-wider select-none pointer-events-none">
                Vault State
              </text>
            </g>

            {agents.map((agent, i) => {
              const coords = getAgentCoords(i, agents.length);
              const isActive = activeAgentId === agent.id;
              return (
                <g
                  key={agent.id}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  onClick={() => onSelectAgent(agent.id)}
                  className="cursor-pointer group"
                >
                  <circle
                    r="24"
                    fill="#0f172a"
                    stroke={isActive ? "#a855f7" : (agent.status === "Active" && agent.balance > 0) ? "rgba(16, 185, 129, 0.4)" : agent.balance <= 0 ? "rgba(245, 158, 11, 0.4)" : "rgba(239, 68, 68, 0.4)"}
                    strokeWidth={isActive ? "2.5" : "1.5"}
                    filter={isActive ? "url(#glow-purple)" : "none"}
                    className="transition-all duration-300 group-hover:stroke-white"
                  />
                  {isActive && (
                    <circle r="28" fill="none" stroke="rgba(168,85,247,0.6)" strokeWidth="1.2" filter="url(#glow-purple)">
                      <animate attributeName="r" values="26;31;26" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.85;0.15;0.85" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text y="4" textAnchor="middle" className="text-[12px] select-none pointer-events-none">
                    🤖
                  </text>
                  <text y="30" textAnchor="middle" fill="#ffffff" className="text-[8px] font-mono font-bold select-none pointer-events-none">
                    #{agent.id}
                  </text>
                  <text y="39" textAnchor="middle" fill={(agent.status === "Active" && agent.balance > 0) ? "#10b981" : agent.balance <= 0 ? "#f59e0b" : "#ef4444"} className="text-[6px] font-mono uppercase font-bold select-none pointer-events-none">
                    {agent.status === "Active" && agent.balance <= 0 ? "Unfunded" : agent.status}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/20 bg-surface-container/75 px-4 py-2 text-zinc-300 text-sm font-medium shadow-[0_0_18px_rgba(0,242,255,0.08)]">
          ⌁ Hover nodes to view diagnostic details
        </div>
      </div>
    </div>
  );
}
