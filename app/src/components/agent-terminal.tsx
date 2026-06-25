"use client";

import React, { useRef, useEffect } from "react";

interface LogLine {
  timestamp: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface AgentTerminalProps {
  logs: LogLine[];
}

export default function AgentTerminal({ logs }: AgentTerminalProps) {
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll terminal container only (prevents window scrolling bug)
  useEffect(() => {
    const container = terminalContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel rounded-xl border border-primary/20 shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden h-[300px]">
      <div className="bg-gradient-to-r from-surface-container-high/70 to-surface-container/60 border-b border-primary/20 px-4 py-2.5 flex justify-between items-center">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-200">Agent Script Console</span>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400/80" />
          <span className="w-2 h-2 rounded-full bg-amber-300/80" />
          <span className="w-2 h-2 rounded-full bg-emerald-300/90 animate-pulse" />
        </div>
      </div>
      
      <div 
        ref={terminalContainerRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 font-mono text-[11px] leading-relaxed bg-[radial-gradient(circle_at_top_left,rgba(0,242,255,0.05),transparent_30%),linear-gradient(180deg,#070b15,#060912)]"
      >
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-2.5 rounded-md px-2 py-1.5 bg-surface-container-low/20 border border-primary/10">
            <span className="text-zinc-500 select-none">[{log.timestamp}]</span>
            <span
              className={
                log.type === "success"
                  ? "text-success-emerald font-semibold"
                  : log.type === "error"
                  ? "text-emergency-red font-semibold"
                  : log.type === "warning"
                  ? "text-amber-400 font-semibold"
                  : "text-vivid-cyan"
              }
            >
              {(() => {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const parts = log.message.split(urlRegex);
                return parts.map((part, i) => {
                  if (part.match(urlRegex)) {
                    return (
                      <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-white transition-colors duration-150 break-all"
                      >
                        {part}
                      </a>
                    );
                  }
                  return <React.Fragment key={i}>{part}</React.Fragment>;
                });
              })()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
