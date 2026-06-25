"use client";

import React from "react";
import { OnChainAgent } from "../../hooks/use-agent-state";

interface StatusMonitorProps {
  connected: boolean;
  walletAddress: string;
  solBalance: number | null;
  activeAgent: OnChainAgent | undefined;
  usdcMint: string;
  simulatedSignerPubKey: string;
  simulationMode: boolean;
}

export default function StatusMonitor({
  connected,
  walletAddress,
  solBalance,
  activeAgent,
  usdcMint,
  simulatedSignerPubKey,
  simulationMode,
}: StatusMonitorProps) {
  return (
    <div className="glass-panel p-5 rounded-xl border border-primary/20 flex flex-col gap-4 bg-surface-container-low/50">
      <div className="flex justify-between items-center border-b border-primary/15 pb-3">
        <h4 className="font-bold text-white font-mono text-xs uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-vivid-cyan animate-pulse" />
          SYSTEM LIVE STATUS MONITOR
        </h4>
        <span className="text-[9px] font-mono uppercase bg-primary/10 text-primary-container px-2 py-0.5 rounded border border-primary/25">
          Diagnostics
        </span>
      </div>

      <div className="flex flex-col gap-3 font-mono text-xs">
        {/* Wallet connection status indicator */}
        <div className="p-3 rounded bg-surface-container-low/65 border border-primary/15 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-[10px] uppercase">Browser Wallet:</span>
            {connected ? (
              <span className="text-success-emerald font-bold text-[11px] flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-success-emerald animate-ping" />
                Connected
              </span>
            ) : (
              <span className="text-emergency-red font-bold text-[11px]">Disconnected</span>
            )}
          </div>
          {connected && walletAddress && (
            <>
              <div className="text-[10px] text-zinc-400 break-all select-all border-t border-primary/10 pt-1.5">
                Address: <span className="text-vivid-cyan font-bold">{walletAddress}</span>
              </div>
              <div className="flex justify-between border-t border-primary/10 pt-1.5 text-[11px]">
                <span className="text-zinc-400">Balance:</span>
                <span className="text-white font-bold">
                  {solBalance !== null ? `${solBalance.toFixed(3)} SOL` : "Querying..."}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Hot-Key State Details */}
        <div className="p-3 rounded bg-surface-container-low/65 border border-primary/15 flex flex-col gap-1.5">
          <span className="text-zinc-500 text-[10px] uppercase">Simulated AI Hot-Key Authority:</span>
          <span className="text-zinc-300 text-[10px] break-all select-all font-bold">
            {simulatedSignerPubKey || "Initializing keypair..."}
          </span>
          <span className="text-[9px] text-zinc-500 border-t border-primary/10 pt-1 mt-1 block">
            Used to sign the smart contract spends autonomously.
          </span>
        </div>

        {/* Selected Active Agent Diagnostic */}
        <div className="p-3 rounded bg-surface-container-low/65 border border-primary/15 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-[10px] uppercase">Active Target Agent:</span>
            {activeAgent ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                (activeAgent.status === "Active" && activeAgent.balance > 0)
                  ? "bg-success-emerald/10 border-success-emerald/20 text-success-emerald"
                  : activeAgent.balance <= 0
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  : "bg-emergency-red/10 border-emergency-red/20 text-emergency-red"
              }`}>
                Agent #{activeAgent.id} - {activeAgent.status === "Active" && activeAgent.balance <= 0 ? "Unfunded" : activeAgent.status}
              </span>
            ) : (
              <span className="text-zinc-500 text-[10px]">None Selected</span>
            )}
          </div>
          {activeAgent ? (
            <div className="grid grid-cols-2 gap-y-2 gap-x-3 border-t border-primary/10 pt-2 text-[10px] text-zinc-400">
              <div>
                Vault Bal:{" "}
                <span className="text-white font-bold">
                  ${activeAgent.balance.toFixed(2)}
                </span>
              </div>
              <div>
                Active Limits: <span className="text-electric-purple font-bold">Enforced</span>
              </div>
              <div className="col-span-2 text-[9px] text-zinc-500 break-all select-all">
                Registry PDA: {activeAgent.publicKey.substring(0, 10)}...{activeAgent.publicKey.substring(activeAgent.publicKey.length - 10)}
              </div>
            </div>
          ) : (
            <span className="text-[10px] text-zinc-500 border-t border-primary/10 pt-2">
              Select or deploy an agent card in Step 2 & 3 to register limits.
            </span>
          )}
        </div>

        {/* Global token mint standard */}
        <div className="p-3 rounded bg-surface-container-low/65 border border-primary/15 flex flex-col gap-1 text-[10px]">
          <span className="text-zinc-500 uppercase">USDC / Token Mint Tracker:</span>
          <span className="text-zinc-400 break-all font-mono select-all mt-0.5 text-[9px]">
            {usdcMint || "No token deployed"}
          </span>
        </div>

        <div className="p-3 rounded bg-surface-container-low/65 border border-primary/15 flex flex-col gap-1 text-[10px]">
          <span className="text-zinc-500 uppercase">Execution Mode:</span>
          <span className={`font-bold ${simulationMode ? "text-amber-300" : "text-emerald-300"}`}>
            {simulationMode ? "Simulation Mode (demo fallback enabled)" : "Real On-Chain Mode (hard failure on errors)"}
          </span>
        </div>
      </div>
    </div>
  );
}
