"use client";

import React from "react";
import { OnChainAgent } from "../../hooks/use-agent-state";

interface FleetTopologyMapProps {
  agents: OnChainAgent[];
  activeAgentId: number;
  solverState: string;
  onSelectAgent: (id: number) => void;
}

export default function FleetTopologyMap({
  agents,
  activeAgentId,
  solverState,
  onSelectAgent,
}: FleetTopologyMapProps) {
  // Center is at (250, 180) - Vault Node
  const cx = 250;
  const cy = 180;
  
  // Recipient Merchant at (430, 180)
  const mx = 430;
  const my = 180;

  // Orbiting satellite agent coordinates based on index
  const getAgentCoords = (index: number, total: number) => {
    if (total === 1) return { x: cx - 120, y: cy };
    
    // Spread orbiting nodes in a semi-circle on the left
    const angleStart = Math.PI * 0.5; // bottom
    const angleEnd = Math.PI * 1.5;   // top
    const angleStep = total > 1 ? (angleEnd - angleStart) / (total - 1) : 0;
    
    const angle = angleStart + index * angleStep;
    const radius = 110;
    return {
      x: Math.round(cx + radius * Math.cos(angle)),
      y: Math.round(cy + radius * Math.sin(angle)),
    };
  };

  const isTransferring = solverState === "signing" || solverState === "done";

  return (
    <div className="w-full glass-panel p-5 rounded-xl border border-glass-border flex flex-col gap-4 bg-black/45 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-glass-border/30">
        <div>
          <h4 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <span className="text-vivid-cyan animate-pulse">⚛️</span> INTERACTIVE FLEET TOPOLOGY MAP
          </h4>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Live SVG network rendering delegated PDA orbiting paths and on-chain payout transfers.
          </p>
        </div>
        {isTransferring && (
          <span className="text-[9px] font-mono font-bold text-vivid-cyan bg-vivid-cyan/10 border border-vivid-cyan/20 px-2 py-0.5 rounded animate-pulse">
            LIVE CPI SWEEP IN FLIGHT
          </span>
        )}
      </div>

      <div className="w-full relative flex items-center justify-center min-h-[300px] border border-glass-border/20 bg-black/35 rounded-lg p-2 overflow-hidden">
        {/* Glowing background grid effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.08),transparent_70%)] pointer-events-none" />
        
        {agents.length === 0 ? (
          <div className="text-center font-mono text-[11px] text-zinc-500 py-20">
            📡 No active nodes detected. Spawn Agent PDAs to render network cables.
          </div>
        ) : (
          <svg viewBox="0 0 500 360" className="w-full max-w-[500px] h-auto drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <defs>
              {/* Glowing effects filters */}
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
              <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connecting cables between Agents and Vault */}
            {agents.map((agent, i) => {
              const coords = getAgentCoords(i, agents.length);
              const isActive = activeAgentId === agent.id;
              return (
                <g key={`link-${agent.id}`}>
                  {/* Glowing background link */}
                  <line
                    x1={coords.x}
                    y1={coords.y}
                    x2={cx}
                    y2={cy}
                    stroke={isActive ? "rgba(147, 51, 234, 0.4)" : "rgba(255, 255, 255, 0.04)"}
                    strokeWidth={isActive ? 2.5 : 1}
                    strokeDasharray={isActive ? "none" : "3, 3"}
                    className="transition-all duration-300"
                  />
                  {/* Flowing animated pulse when executing solver */}
                  {isActive && isTransferring && (
                    <circle r="4" fill="#a855f7" filter="url(#glow-purple)">
                      <animateMotion
                        path={`M ${coords.x} ${coords.y} L ${cx} ${cy}`}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Connecting cable between Vault and Server Agent */}
            <line
              x1={cx}
              y1={cy}
              x2={mx}
              y2={my}
              stroke={isTransferring ? "rgba(6, 182, 212, 0.5)" : "rgba(255, 255, 255, 0.05)"}
              strokeWidth={isTransferring ? 3 : 1}
              className="transition-all duration-300"
            />

            {/* Animated transaction payment pulse towards Server Agent */}
            {solverState === "signing" && (
              <circle r="5" fill="#06b6d4" filter="url(#glow-cyan)">
                <animateMotion
                  path={`M ${cx} ${cy} L ${mx} ${my}`}
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Animated return premium decrypted data pulse from Server to Vault */}
            {solverState === "done" && (
              <circle r="6" fill="#10b981" filter="url(#glow-green)">
                <animateMotion
                  path={`M ${mx} ${my} L ${cx} ${cy}`}
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Orbiting loop animated return data pulses from Vault back to active Agent */}
            {agents.map((agent, i) => {
              const coords = getAgentCoords(i, agents.length);
              const isActive = activeAgentId === agent.id;
              if (isActive && solverState === "done") {
                return (
                  <circle key={`return-${agent.id}`} r="5" fill="#10b981" filter="url(#glow-green)">
                    <animateMotion
                      path={`M ${cx} ${cy} L ${coords.x} ${coords.y}`}
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                );
              }
              return null;
            })}

            {/* Recipient Central Server Agent Node */}
            <g transform={`translate(${mx}, ${my})`}>
              <circle
                r="22"
                fill="#0f172a"
                stroke={isTransferring ? "#06b6d4" : "#1e293b"}
                strokeWidth="2"
                filter={isTransferring ? "url(#glow-cyan)" : "none"}
                className="transition-all duration-500"
              />
              <text y="4" textAnchor="middle" className="text-[12px] select-none pointer-events-none">
                🧠
              </text>
              <text y="32" textAnchor="middle" fill="#06b6d4" className="text-[8px] font-mono font-bold select-none pointer-events-none">
                Server Agent
              </text>
            </g>

            {/* Central Vault Node */}
            <g transform={`translate(${cx}, ${cy})`}>
              <circle
                r="30"
                fill="#0f172a"
                stroke="#eab308"
                strokeWidth="2.5"
                className="shadow-2xl"
              />
              {/* Spinning status ring */}
              <circle
                r="35"
                fill="none"
                stroke="rgba(234, 179, 8, 0.2)"
                strokeWidth="1.5"
                strokeDasharray="10, 15"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="10s"
                  repeatCount="indefinite"
                />
              </circle>
              <text y="5" textAnchor="middle" className="text-[16px] select-none pointer-events-none">
                💰
              </text>
              <text y="42" textAnchor="middle" fill="#eab308" className="text-[8px] font-mono font-bold uppercase tracking-wider select-none pointer-events-none">
                Vault State
              </text>
            </g>

            {/* Spawned Orbiting Satellite Agent Nodes */}
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
                  {/* Selected glowing ring */}
                  <circle
                    r="24"
                    fill="#0f172a"
                    stroke={
                      isActive
                        ? "#a855f7"
                        : agent.status === "Active"
                        ? "rgba(16, 185, 129, 0.4)"
                        : "rgba(239, 68, 68, 0.4)"
                    }
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
                  <text y="39" textAnchor="middle" fill={agent.status === "Active" ? "#10b981" : "#ef4444"} className="text-[6px] font-mono uppercase font-bold select-none pointer-events-none">
                    {agent.status}
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
