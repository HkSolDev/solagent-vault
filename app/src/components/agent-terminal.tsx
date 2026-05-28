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
    <div className="glass-panel rounded-xl flex flex-col overflow-hidden h-[300px]">
      <div className="bg-white/5 border-b border-glass-border px-4 py-2 flex justify-between items-center">
        <span className="font-mono text-xs font-bold text-zinc-300">Agent Script Console</span>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emergency-red" />
          <span className="w-2 h-2 rounded-full bg-vivid-cyan" />
          <span className="w-2 h-2 rounded-full bg-success-emerald animate-pulse" />
        </div>
      </div>
      
      <div 
        ref={terminalContainerRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 font-mono text-[11px] leading-relaxed bg-[#050508]"
      >
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="text-zinc-600 select-none">[{log.timestamp}]</span>
            <span
              className={
                log.type === "success"
                  ? "text-success-emerald font-semibold"
                  : log.type === "error"
                  ? "text-emergency-red font-semibold"
                  : log.type === "warning"
                  ? "text-amber-500 font-semibold"
                  : "text-vivid-cyan"
              }
            >
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
