"use client";

import React from "react";

interface SpendingPolicyTestCardProps {
  spendAmount: string;
  setSpendAmount: (val: string) => void;
  onSpend: (mode: "normal" | "exploit-cap" | "exploit-rate" | "exploit-allowlist") => Promise<void>;
  actionLoading: boolean;
  connected: boolean;
}

export default function SpendingPolicyTestCard({
  spendAmount,
  setSpendAmount,
  onSpend,
  actionLoading,
  connected,
}: SpendingPolicyTestCardProps) {
  return (
    <div className="glass-panel p-5 rounded-xl flex flex-col gap-4">
      <h4 className="font-bold text-white font-mono text-sm">TEST SPENDING POLICY GUARDS</h4>
      
      <div className="flex items-center gap-3">
        <input
          value={spendAmount}
          onChange={(e) => setSpendAmount(e.target.value)}
          type="text"
          className="bg-white/5 border border-glass-border px-3 py-2 rounded text-sm text-white font-mono max-w-[80px] focus:outline-none"
        />
        <span className="text-xs font-mono text-zinc-400">USDC</span>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={() => onSpend("normal")}
          disabled={actionLoading || !connected}
          className="py-2 px-3 rounded bg-zinc-800 hover:bg-zinc-700 font-mono text-xs text-left text-zinc-200 border border-glass-border transition-all flex justify-between cursor-pointer disabled:opacity-50"
        >
          <span>✅ Normal Spend Request</span>
          <span className="text-zinc-500">Under Limits</span>
        </button>
        <button
          onClick={() => onSpend("exploit-cap")}
          disabled={actionLoading || !connected}
          className="py-2 px-3 rounded bg-emergency-red/10 hover:bg-emergency-red/20 font-mono text-xs text-left text-emergency-red border border-emergency-red/20 transition-all flex justify-between cursor-pointer disabled:opacity-50"
        >
          <span>🚨 Bypass Max Single-Call Cap</span>
          <span className="text-emergency-red/60">Should Revert</span>
        </button>
        <button
          onClick={() => onSpend("exploit-rate")}
          disabled={actionLoading || !connected}
          className="py-2 px-3 rounded bg-emergency-red/10 hover:bg-emergency-red/20 font-mono text-xs text-left text-emergency-red border border-emergency-red/20 transition-all flex justify-between cursor-pointer disabled:opacity-50"
        >
          <span>🚨 Hammer Rate Limit (Spike)</span>
          <span className="text-emergency-red/60">Should Revert</span>
        </button>
        <button
          onClick={() => onSpend("exploit-allowlist")}
          disabled={actionLoading || !connected}
          className="py-2 px-3 rounded bg-emergency-red/10 hover:bg-emergency-red/20 font-mono text-xs text-left text-emergency-red border border-emergency-red/20 transition-all flex justify-between cursor-pointer disabled:opacity-50"
        >
          <span>🚨 Spend to Unregistered Provider</span>
          <span className="text-emergency-red/60">Should Revert</span>
        </button>
      </div>
    </div>
  );
}
