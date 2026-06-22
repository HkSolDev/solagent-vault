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
    <div className="w-full glass-panel p-5 rounded-xl border border-glass-border flex flex-col gap-4 bg-black/45 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-glass-border/30">
        <div>
          <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <span className="text-vivid-cyan animate-pulse">⚛️</span> INTERACTIVE FLEET TOPOLOGY MAP
          </h4>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Live nodes from active agents and runtime inference/back-end routes.
          </p>
        </div>
        {isTransferring && (
          <span className="text-[9px] font-mono font-bold text-vivid-cyan bg-vivid-cyan/10 border border-vivid-cyan/20 px-2 py-0.5 rounded animate-pulse">
            LIVE SWEEP IN FLIGHT
          </span>
        )}
      </div>

      <div className="w-full relative flex items-center justify-center min-h-[300px] border border-glass-border/20 bg-black/35 rounded-lg p-2 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.08),transparent_70%)] pointer-events-none" />

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
            </defs>

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
      </div>
    </div>
  );
}
