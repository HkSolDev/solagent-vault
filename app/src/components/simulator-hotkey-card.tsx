"use client";

import React from "react";

interface SimulatorHotkeyCardProps {
  pubKey: string;
}

export default function SimulatorHotkeyCard({ pubKey }: SimulatorHotkeyCardProps) {
  return (
    <div className="glass-panel p-5 rounded-xl flex flex-col gap-3 font-mono text-xs">
      <h4 className="font-bold text-white flex items-center gap-2">
        <span>🛡️</span> LOCAL SIMULATOR HOT-KEY
      </h4>
      <div className="p-3 rounded bg-white/5 border border-glass-border flex flex-col gap-1.5">
        <span className="text-zinc-400">Public Key:</span>
        <span className="text-vivid-cyan text-[11px] break-all select-all">
          {pubKey || "Loading..."}
        </span>
      </div>
    </div>
  );
}
