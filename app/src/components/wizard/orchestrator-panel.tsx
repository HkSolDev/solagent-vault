"use client";

import React, { useState } from "react";
import { useSimulatorState } from "../../hooks/use-simulator-state";

export default function OrchestratorPanel() {
  const {
    orchestratorBudget,
    setOrchestratorBudget,
    runningTask,
    activeSubAgents,
    failedAgents,
    watchdogAlerts,
    generatedFiles,
    orchestratorState,
    handleRunOrchestrator,
    actionLoading,
    sharedContext,
  } = useSimulatorState();

  const [taskInput, setTaskInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  const [sandboxTab, setSandboxTab] = useState<"code" | "preview">("code");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskInput.trim()) {
      handleRunOrchestrator(taskInput.trim());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "text-success-emerald";
      case "Paused": return "text-emergency-red";
      default: return "text-zinc-500";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Input and Controls */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-xl border border-glass-border bg-black/40">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 font-mono">
              <span>🎯</span> DEFINE GLOBAL OBJECTIVE
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <textarea
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="e.g. Build a secure e-commerce platform with automated token payouts..."
                className="w-full h-32 bg-black/50 border border-glass-border rounded-lg p-4 text-xs font-mono text-white focus:border-electric-purple focus:outline-none transition-colors"
                disabled={orchestratorState !== "idle"}
              />
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Total Budget Pool (USDC)</label>
                  <input
                    type="number"
                    value={orchestratorBudget}
                    onChange={(e) => setOrchestratorBudget(e.target.value)}
                    className="bg-black/40 border border-glass-border rounded px-3 py-1.5 text-xs font-mono text-white w-32 focus:border-vivid-cyan outline-none"
                    disabled={orchestratorState !== "idle"}
                  />
                </div>
                <button
                  type="submit"
                  disabled={orchestratorState !== "idle" || actionLoading}
                  className="px-6 py-2.5 rounded-lg font-mono text-xs font-bold bg-electric-purple hover:bg-electric-purple/90 text-white transition-all shadow-glow-purple disabled:opacity-50"
                >
                  {orchestratorState === "idle" ? "LAUNCH ORCHESTRATOR" : "RUNNING..."}
                </button>
              </div>
            </form>
          </div>

          {/* Execution Diagram / Visualization */}
          <div className="glass-panel p-6 rounded-xl border border-glass-border bg-black/40 flex flex-col gap-4 min-h-[300px]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono border-b border-glass-border/30 pb-3">
              <span>🏗️</span> EXECUTION TOPOLOGY
            </h3>
            
            {orchestratorState === "idle" && !runningTask ? (
              <div className="flex-1 flex items-center justify-center text-zinc-600 font-mono text-xs">
                Waiting for task initiation...
              </div>
            ) : (
              <div className="flex flex-col gap-6 py-4">
                {/* Root Node */}
                <div className="flex justify-center">
                  <div className="p-4 rounded-xl border border-electric-purple bg-electric-purple/10 flex flex-col items-center gap-2 min-w-[150px] shadow-glow-purple">
                    <span className="text-xl">🧠</span>
                    <span className="text-[10px] font-mono font-bold text-white uppercase tracking-tighter">Root Orchestrator</span>
                    <span className="text-[9px] font-mono text-zinc-400">Budget: ${orchestratorBudget} USDC</span>
                  </div>
                </div>

                {/* Connectors */}
                <div className="flex justify-center h-8">
                  <div className="w-px bg-glass-border relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-glass-border" />
                  </div>
                </div>

                {/* Sub Nodes */}
                <div className="grid grid-cols-3 gap-4">
                  {activeSubAgents.map((agent) => (
                    <div key={agent.id} className="flex flex-col items-center gap-2">
                      <div className={"p-3 rounded-lg border flex flex-col items-center gap-2 w-full transition-all " + (
                        failedAgents.includes(agent.id) ? "border-emergency-red bg-emergency-red/10" : "border-vivid-cyan bg-vivid-cyan/5"
                      )}>
                        <span className="text-lg">🤖</span>
                        <span className="text-[9px] font-mono font-bold text-center text-white leading-tight">{agent.role}</span>
                        <span className="text-[8px] font-mono text-zinc-500">${agent.budget} USDC</span>
                        <span className={"text-[8px] font-mono font-black uppercase " + getStatusColor(agent.status)}>
                          {agent.status}
                        </span>
                        {agent.progress !== undefined && (
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5 border border-zinc-700">
                            <div className="bg-electric-purple h-full transition-all duration-500 animate-pulse" style={{ width: `${agent.progress}%` }} />
                          </div>
                        )}
                        {agent.activity && (
                          <span className="text-[7px] text-zinc-400 text-center leading-tight italic mt-0.5 line-clamp-2">
                            {agent.activity}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Watchdog and Logs */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Watchdog Status */}
          <div className="glass-panel p-5 rounded-xl border border-emergency-red/30 bg-black/45 shadow-2xl flex flex-col gap-3 font-mono">
            <h4 className="text-xs font-bold text-emergency-red flex items-center gap-1.5 uppercase">
              <span>🛡️</span> Multi-Agent Watchdog
            </h4>
            <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
              {watchdogAlerts.length === 0 ? (
                <p className="text-[10px] text-zinc-600 italic">No anomalies detected. Scanning network...</p>
              ) : (
                watchdogAlerts.map((alert, i) => (
                  <div key={i} className={"p-2 rounded border text-[9px] " + (
                    alert.severity === "error" ? "bg-emergency-red/10 border-emergency-red/30 text-emergency-red" : 
                    alert.severity === "warning" ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                    "bg-blue-500/10 border-blue-500/30 text-blue-400"
                  )}>
                    [{new Date(alert.timestamp).toLocaleTimeString()}] {alert.message}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shared Memory Cache */}
          <div className="glass-panel p-5 rounded-xl border border-glass-border bg-black/45 shadow-2xl flex flex-col gap-3 font-mono">
            <h4 className="text-xs font-bold text-vivid-cyan flex items-center gap-1.5 uppercase">
              <span>🧠</span> Shared Knowledge Cache
            </h4>
            <div className="flex flex-col gap-2.5 text-[9px] text-zinc-400">
              <div className="flex justify-between items-center border-b border-white/5 pb-1">
                <span className="text-zinc-500">DATABASE SCHEMA:</span>
                <span className={sharedContext.schemaDesign ? "text-success-emerald font-bold truncate max-w-[200px]" : "text-zinc-600 italic"}>
                  {sharedContext.schemaDesign ? "Schema cached (verified)" : "Empty"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-1">
                <span className="text-zinc-500">API ROUTER SPECS:</span>
                <span className={sharedContext.apiSpecs ? "text-success-emerald font-bold truncate max-w-[200px]" : "text-zinc-600 italic"}>
                  {sharedContext.apiSpecs || "Empty"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-1">
                <span className="text-zinc-500">REACT COMPONENT CODES:</span>
                <span className={sharedContext.uiComponents ? "text-success-emerald font-bold truncate max-w-[200px]" : "text-zinc-600 italic"}>
                  {sharedContext.uiComponents ? "Components compiled" : "Empty"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-zinc-500">STANDBY RECOVERY STATE:</span>
                <span className={sharedContext.recoveryAttempted ? "text-amber-500 font-bold" : "text-zinc-600 italic"}>
                  {sharedContext.recoveryAttempted ? "Failover complete" : "Standby idle"}
                </span>
              </div>
            </div>
          </div>

          {/* Output Files */}
          <div className="glass-panel p-5 rounded-xl border border-glass-border bg-black/45 shadow-2xl flex flex-col gap-3 font-mono flex-1 min-h-[250px]">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
              <span>📂</span> Generated Artifacts
            </h4>
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
              {generatedFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-30">
                  <span className="text-3xl">🏜️</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">No artifacts generated</span>
                </div>
              ) : (
                generatedFiles.map((file, i) => (
                  <div key={i} className="group cursor-pointer" onClick={() => { setSelectedFile(file); setSandboxTab("code"); }}>
                    <div className="flex items-center gap-2 p-2 hover:bg-white/5 rounded border border-glass-border/30 transition-colors">
                      <span className="text-amber-500 text-xs">📄</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white font-bold">{file.name}</span>
                        <span className="text-[8px] text-zinc-500 truncate max-w-[180px]">{file.content.substring(0, 40)}...</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected File / Sandbox Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel p-6 rounded-xl border border-glass-border bg-[#05050b] max-w-2xl w-full flex flex-col gap-4 font-mono text-xs shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-glass-border/30 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>📄</span> {selectedFile.name}
              </h3>
              <div className="flex gap-2">
                {selectedFile.name === "App.tsx" && (
                  <div className="flex bg-black/40 border border-glass-border rounded overflow-hidden">
                    <button
                      onClick={() => setSandboxTab("code")}
                      className={`px-3 py-1 text-[10px] ${sandboxTab === "code" ? "bg-electric-purple text-white" : "text-zinc-500"}`}
                    >
                      Source Code
                    </button>
                    <button
                      onClick={() => setSandboxTab("preview")}
                      className={`px-3 py-1 text-[10px] ${sandboxTab === "preview" ? "bg-vivid-cyan text-black font-bold" : "text-zinc-500"}`}
                    >
                      🖥️ Live Preview
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-zinc-500 hover:text-zinc-300 font-bold text-sm px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 min-h-[300px] max-h-[450px] overflow-auto bg-black/50 border border-glass-border rounded p-4 text-[11px] leading-relaxed custom-scrollbar">
              {sandboxTab === "code" ? (
                <pre className="text-zinc-300 whitespace-pre-wrap font-mono select-all">
                  {selectedFile.content}
                </pre>
              ) : (
                /* LIVE INTERACTIVE PREVIEW SANDBOX */
                <div className="flex flex-col items-center justify-center p-6 h-full gap-4 text-center">
                  <div className="p-6 bg-[#0c0c17] rounded-xl border border-glass-border max-w-sm w-full shadow-2xl flex flex-col gap-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-500 font-bold uppercase">🔧 Sandbox Preview</span>
                      <span className="w-2 h-2 rounded-full bg-success-emerald animate-ping" />
                    </div>
                    
                    <h1 className="text-sm font-extrabold text-vivid-cyan text-left mt-2">
                      🤖 AI GPU Compute Core
                    </h1>
                    <p className="text-[10px] text-zinc-400 text-left leading-normal">
                      Allocates 1x NVIDIA H100 high-performance instance. Authenticates using HTTP 402 intercept protocols.
                    </p>
                    
                    <div className="h-px bg-glass-border/30 my-2" />
                    
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] text-zinc-500">PAYWALL COST:</span>
                        <span className="text-xs font-bold text-success-emerald font-mono">$15.00 USDC</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          alert("🎉 SolAgent Vault intercept: authorized secure spend of $15.00 USDC successfully!");
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-electric-purple to-purple-600 font-bold text-[10px] text-white rounded hover:opacity-90 transition-all shadow-glow-purple"
                      >
                        🚀 Purchase Instance
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-glass-border/30 pt-3 text-[9px] text-zinc-500">
              Double-click file contents to select all.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
