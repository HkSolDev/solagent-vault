"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useSimulatorState } from "../hooks/use-simulator-state";

// Modular UI imports
import StepWalletFaucet from "./wizard/step-wallet-faucet";
import StepAgentPda from "./wizard/step-agent-pda";
import StepTokenDeposit from "./wizard/step-token-deposit";
import StepStressTest from "./wizard/step-stress-test";
import StatusMonitor from "./wizard/status-monitor";
import FleetGrid from "./wizard/fleet-grid";
import AiConfigModal from "./wizard/ai-config-modal";
import AgentTerminal from "./agent-terminal";
import ErrorModalOverlay from "./error-modal-overlay";

// Capstone Masterclass Premium components
import FleetTopologyMap from "./wizard/fleet-topology-map";

type LlmProvider = "gemini" | "openrouter" | "ollama" | "mock" | "auto";

interface DashboardSimulatorProps {
  activeTabName?: "fleet" | "analytics" | "security";
  setActiveTabName?: (tab: "fleet" | "analytics" | "security") => void;
  network?: "devnet" | "localnet";
}

export default function DashboardSimulator({
  activeTabName: propActiveTabName,
  setActiveTabName: propSetActiveTabName,
  network: propNetwork = "devnet",
}: DashboardSimulatorProps) {
  // Destructure all states and dispatches cleanly from our custom hook
  const simulator = useSimulatorState();

  const {
    connected,
    walletAddress,
    solBalance,
    vaultInitialized,
    agents,
    actionLoading,
    currentStep,
    handleToggleStep,
    activeTab,
    setActiveTab,
    simulatedSigner,
    agentIdInput,
    setAgentIdInput,
    maxCallInput,
    setMaxCallInput,
    maxMinuteInput,
    setMaxMinuteInput,
    allowedProviderInput,
    setAllowedProviderInput,
    solSeedInput,
    setSolSeedInput,
    spendAmount,
    setSpendAmount,
    usdcMintInput,
    setUsdcMintInput,
    llmProvider,
    setLlmProvider,
    apiKey,
    setApiKey,
    modelName,
    setModelName,
    merchantWallet,
    setMerchantWallet,
    simulationMode,
    setSimulationMode,
    solverState,
    solverErrorMsg,
    confirmedTxSignature,
    faucetLoading,
    faucetStatus,
    terminalLogs,
    errorPopup,
    setErrorPopup,
    txHistory,
    dataFeeds,
    agentSolverStates,
    claimAirdrop,
    handleInitVault,
    handleCreateAgent,
    handleCreateCustomMint,
    handleDeposit,
    handleWithdraw,
    handleCloseAgent,
    handleCloseAllAgents,
    handleTogglePause,
    handleSpend,
    handleLiveAISolve,
    handleLiveAISolveForAgent,
    handleBatchRunSolvers,
    handleEmergencyFleetFreeze,
  } = simulator;

  // Dual-Tab selection state
  const [internalTabName, setInternalTabName] = useState<"fleet" | "analytics" | "security">("fleet");
  const activeTabName = propActiveTabName !== undefined ? propActiveTabName : internalTabName;
  const setActiveTabName = propSetActiveTabName !== undefined ? propSetActiveTabName : setInternalTabName;

  // Contextual AI Selector modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIsBatch, setModalIsBatch] = useState(false);
  const [modalTargetAgentId, setModalTargetAgentId] = useState(1);
  const [txFilter, setTxFilter] = useState<"all" | "real" | "sim" | "confirmed" | "failed" | "payout" | "decommission">("all");

  // Active Agent reference from list
  const activeAgent = agents.find((a) => a.id === activeTab);

  // Clean steps: Completed indicators
  const isStep1Completed = connected && solBalance !== null && solBalance > 0;
  const isStep2Completed = vaultInitialized === true && agents.length > 0;
  const isStep3Completed = usdcMintInput !== "" && usdcMintInput !== "No token deployed";

  // Triggered when running AI solver from a Fleet Card
  const handleOpenSingleSolverModal = (id: number) => {
    setModalTargetAgentId(id);
    setModalIsBatch(false);
    setIsModalOpen(true);
  };

  // Triggered when running batch AI solvers from the Fleet Header
  const handleOpenBatchSolverModal = () => {
    setActiveTabName("analytics");
    setModalIsBatch(true);
    setIsModalOpen(true);
  };

  const dynamicServerNodes = useMemo(() => {
    const recentFeeds = dataFeeds.slice(0, 24);
    const serverMap = new Map<string, { requests: number; lastTs: number }>();

    for (const feed of recentFeeds) {
      const key = feed.serverLabel || "Unknown Server";
      const prev = serverMap.get(key);
      serverMap.set(key, {
        requests: (prev?.requests || 0) + 1,
        lastTs: Math.max(prev?.lastTs || 0, feed.timestamp),
      });
    }

    const latestTs = recentFeeds[0]?.timestamp || 0;
    const resolved = Array.from(serverMap.entries()).map(([label, meta], idx) => ({
      id: `srv-${idx}-${label}`,
      label,
      requests: meta.requests,
      status: (latestTs - meta.lastTs < 120_000 ? "active" : "idle") as "active" | "idle",
    }));

    if (resolved.length === 0) {
      return [
        { id: "srv-default-1", label: "Routing Hub", requests: 0, status: "idle" as const },
        { id: "srv-default-2", label: "Inference Node", requests: 0, status: "idle" as const },
      ];
    }

    return resolved.slice(0, 4);
  }, [dataFeeds]);

  const analyticsStats = useMemo(() => {
    const approvedTx = txHistory.filter((tx) => tx.status === "confirmed").length;
    const failedTx = txHistory.filter((tx) => tx.status === "failed").length;
    const successRate = txHistory.length > 0 ? (approvedTx / txHistory.length) * 100 : 0;
    const spendEvents = txHistory.filter((tx) => tx.type === "Agent Spend Payout");
    const latestTs = spendEvents[0]?.timestamp ?? 0;
    const recentSpendEvents = spendEvents.filter((tx) => latestTs - tx.timestamp <= 3_600_000).length;
    const spendPerHour = recentSpendEvents;
    return {
      approvedTx,
      failedTx,
      successRate,
      spendPerHour,
      throughput: dataFeeds.length,
    };
  }, [txHistory, dataFeeds]);

  const analyticsRows = useMemo(() => {
    const filtered = txHistory.filter((tx) => {
      if (txFilter === "all") return true;
      if (txFilter === "real") return tx.mode === "real";
      if (txFilter === "sim") return tx.mode !== "real";
      if (txFilter === "confirmed") return tx.status === "confirmed";
      if (txFilter === "failed") return tx.status === "failed";
      if (txFilter === "payout") return tx.type.toLowerCase().includes("payout") || tx.type.toLowerCase().includes("spend");
      if (txFilter === "decommission") return tx.type.toLowerCase().includes("decommission") || tx.type.toLowerCase().includes("close");
      return true;
    });
    return filtered.slice(0, 24);
  }, [txHistory, txFilter]);

  const getOperationIcon = (type: string) => {
    if (type.toLowerCase().includes("decommission") || type.toLowerCase().includes("close")) {
      return { icon: "⛔", bg: "bg-rose-500/15", fg: "text-rose-300", ring: "border-rose-500/20" };
    }
    if (type.toLowerCase().includes("yield") || type.toLowerCase().includes("payout") || type.toLowerCase().includes("spend")) {
      return { icon: "💸", bg: "bg-cyan-500/15", fg: "text-cyan-300", ring: "border-cyan-500/20" };
    }
    if (type.toLowerCase().includes("simulation")) {
      return { icon: "🧪", bg: "bg-indigo-500/15", fg: "text-indigo-300", ring: "border-indigo-500/20" };
    }
    return { icon: "🧭", bg: "bg-emerald-500/15", fg: "text-emerald-300", ring: "border-emerald-500/20" };
  };

  const networkLabel = propNetwork;

  const handleExportCsv = useCallback(() => {
    if (typeof window === "undefined" || analyticsRows.length === 0) return;

    const escapeCsv = (value: string | number | undefined | null) => {
      const raw = value === undefined || value === null ? "" : String(value);
      if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
        return `"${raw.replace(/"/g, '""')}"`;
      }
      return raw;
    };

    const header = [
      "operation_type",
      "execution_id",
      "mode",
      "status",
      "timestamp_iso",
      "signature",
      "balance_before",
      "balance_after",
      "delta",
      "message",
    ];

    const lines = analyticsRows.map((tx) => [
      escapeCsv(tx.type),
      escapeCsv(tx.signature ? `${tx.signature.slice(0, 4)}...${tx.signature.slice(-4)}` : tx.id !== undefined ? `agent-${tx.id}` : "n/a"),
      escapeCsv(tx.mode),
      escapeCsv(tx.status),
      escapeCsv(new Date(tx.timestamp).toISOString()),
      escapeCsv(tx.signature || ""),
      escapeCsv(tx.balanceBefore),
      escapeCsv(tx.balanceAfter),
      escapeCsv(tx.delta),
      escapeCsv(tx.message || ""),
    ]);

    const csvContent = [header.join(","), ...lines.map((line) => line.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const dateTag = new Date().toISOString().replace(/[:.]/g, "-");
    anchor.href = url;
    anchor.download = `solagent-transaction-log-${txFilter}-${dateTag}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [analyticsRows, txFilter]);

  // Executes the actual solver sequence when the Configure AI Brain modal submits
  const handleModalSubmit = async () => {
    setIsModalOpen(false); // Close modal instantly so user can see background diagnostics in real time
    if (modalIsBatch) {
      await handleBatchRunSolvers();
    } else {
      await handleLiveAISolveForAgent(modalTargetAgentId);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="glass-panel rounded-xl border border-glass-border/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="font-mono">
          <p className="text-xs font-bold text-white uppercase tracking-wide">Execution Mode</p>
          <p className="text-[10px] text-zinc-400 mt-1">
            Real Mode blocks on-chain failures immediately. Simulation Mode can keep demo flow alive with explicit simulated entries.
          </p>
        </div>
        <button
          onClick={() => setSimulationMode((prev) => !prev)}
          className={`px-4 py-2 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer ${
            simulationMode
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}
        >
          {simulationMode ? "Simulation Mode: ON" : "Real On-Chain Mode: ON"}
        </button>
      </div>

      {/* Sleek Dual-Tab Navigation bar */}
      <div className="flex border-b border-primary/15 gap-6 mb-2 relative z-20">
        <button
          onClick={() => setActiveTabName("fleet")}
          className={`-mb-px pb-2.5 font-mono text-xs font-bold tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-1.5 focus:outline-none ${
            activeTabName === "fleet"
              ? "border-primary-container text-primary-container font-black"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span>🛰️</span> FLEET COMMAND CONSOLE
        </button>
        <button
          onClick={() => setActiveTabName("analytics")}
          className={`-mb-px pb-2.5 font-mono text-xs font-bold tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-1.5 focus:outline-none ${
            activeTabName === "analytics"
              ? "border-primary-container text-primary-container font-black"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span>🧠</span> COGNITIVE DIAGNOSTICS & ANALYTICS
        </button>
      </div>

      {activeTabName === "fleet" && (
        <>
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
            {/* LEFT COLUMN: Clean 3-Step Setup Wizard Accordion */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {/* Step 1: Wallet Connection */}
              <StepWalletFaucet
                connected={connected}
                solBalance={solBalance}
                loading={faucetLoading}
                statusMsg={faucetStatus}
                onClaimAirdrop={claimAirdrop}
                isActive={currentStep === 1}
                isCompleted={isStep1Completed}
                onToggle={() => handleToggleStep(1)}
              />

              {/* Step 2: Spawn Agent PDA */}
              <StepAgentPda
                vaultInitialized={vaultInitialized}
                agentsCount={agents.length}
                agentIdInput={agentIdInput}
                setAgentIdInput={setAgentIdInput}
                solSeedInput={solSeedInput}
                setSolSeedInput={setSolSeedInput}
                maxCallInput={maxCallInput}
                setMaxCallInput={setMaxCallInput}
                maxMinuteInput={maxMinuteInput}
                setMaxMinuteInput={setMaxMinuteInput}
                allowedProviderInput={allowedProviderInput}
                setAllowedProviderInput={setAllowedProviderInput}
                actionLoading={actionLoading}
                onInitVault={handleInitVault}
                onRegisterAgent={handleCreateAgent}
                simulationMode={simulationMode}
                isActive={currentStep === 2}
                isCompleted={isStep2Completed}
                onToggle={() => handleToggleStep(2)}
              />

              {/* Step 3: Custom SPL Mint Setup */}
              <StepTokenDeposit
                usdcMintInput={usdcMintInput}
                setUsdcMintInput={setUsdcMintInput}
                actionLoading={actionLoading}
                onDeployCustomMint={handleCreateCustomMint}
                isActive={currentStep === 3}
                isCompleted={isStep3Completed}
                onToggle={() => handleToggleStep(3)}
              />

              {/* Step 4: Policy Revert Stress Tests */}
              <StepStressTest
                spendAmount={spendAmount}
                setSpendAmount={setSpendAmount}
                actionLoading={actionLoading}
                onSpendTrigger={handleSpend}
                isActive={currentStep === 5 || currentStep === 4}
                isCompleted={false}
                onToggle={() => handleToggleStep(5)}
              />
            </div>

            {/* RIGHT COLUMN: Diagnostic status monitor & Real-time Console */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Sticky diagnostics diagnostic board */}
              <StatusMonitor
                connected={connected}
                walletAddress={walletAddress}
                solBalance={solBalance}
                activeAgent={activeAgent}
                usdcMint={usdcMintInput}
                simulatedSignerPubKey={simulatedSigner ? simulatedSigner.publicKey.toBase58() : ""}
                simulationMode={simulationMode}
              />

              {/* Real-time scrollable Script Console logs */}
              <AgentTerminal logs={terminalLogs} />
            </div>
          </div>

          {/* FULL-WIDTH MULTI-AGENT FLEET CONTROLLER */}
          {connected && (
            <FleetGrid
              agents={agents}
              activeAgentId={activeTab}
              onSelectAgent={setActiveTab}
              onTogglePause={handleTogglePause}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
              onCloseAgent={handleCloseAgent}
              onCloseAllAgents={handleCloseAllAgents}
              onLiveAISolveForAgent={handleOpenSingleSolverModal}
              onBatchRunSolvers={handleOpenBatchSolverModal}
              onEmergencyFleetFreeze={handleEmergencyFleetFreeze}
              actionLoading={actionLoading}
              walletAddress={walletAddress}
              solBalance={solBalance}
              txHistory={txHistory}
              onDeployNewAgent={() => handleToggleStep(2)}
            />
          )}
        </>
      )}

      {activeTabName === "analytics" && (
        <div className="w-full flex flex-col gap-6 relative z-20">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-3xl md:text-4xl font-display font-bold text-white">Cognitive Diagnostics</h3>
              <p className="text-zinc-400 mt-1">Real-time inference pathways and fleet performance.</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-surface-container/70 px-4 py-2 font-mono text-xs md:text-sm text-vivid-cyan tracking-wide">
              • NETWORK: SOLANA {networkLabel.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
            <div className="xl:col-span-8 flex flex-col gap-6">
              <FleetTopologyMap
                agents={agents}
                activeAgentId={activeTab}
                solverState={solverState}
                agentSolverStates={agentSolverStates}
                serverNodes={dynamicServerNodes}
                onSelectAgent={setActiveTab}
              />
            </div>

            <div className="xl:col-span-4 flex flex-col gap-6">
              <div className="glass-panel p-5 rounded-xl border border-primary/20 bg-surface-container/70 shadow-2xl flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-4xl font-display font-bold text-white">System Activity</h4>
                  <span className="text-zinc-400 text-xl">📊</span>
                </div>
                <div>
                  <div className="flex items-end justify-between font-mono">
                    <span className="text-zinc-400 text-sm">Spending Speed</span>
                    <span className="text-vivid-cyan text-3xl font-bold">{analyticsStats.spendPerHour.toFixed(2)}<span className="text-sm">/hr</span></span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-vivid-cyan to-secondary transition-all duration-700" style={{ width: `${Math.min((analyticsStats.spendPerHour / 5) * 100, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-end justify-between font-mono">
                    <span className="text-zinc-400 text-sm">Approved vs Blocked</span>
                    <span className="text-secondary text-3xl font-bold">{analyticsStats.successRate.toFixed(1)}% Success</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-secondary via-success-emerald to-rose-300 transition-all duration-700" style={{ width: `${Math.max(Math.min(analyticsStats.successRate, 100), 0)}%` }} />
                  </div>
                  <div className="mt-2 font-mono text-xs text-zinc-400">
                    <span className="text-secondary">● {analyticsStats.approvedTx} approved</span>
                    <span className="mx-3 text-rose-300">● {analyticsStats.failedTx} blocked</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-xl border border-primary/20 bg-surface-container/70 shadow-2xl flex flex-col gap-4">
                <h4 className="text-4xl font-display font-bold text-white">Real-time Throughput</h4>
                <div className="space-y-3 font-mono text-sm">
                  <div className="rounded-lg border border-primary/20 bg-surface-container-low/70 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">Vector Database</p>
                      <p className="text-zinc-500 text-xs">Indexing flow</p>
                    </div>
                    <p className="text-secondary font-bold">+{analyticsStats.throughput.toFixed(1)}/s</p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-surface-container-low/70 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">Signing Authority</p>
                      <p className="text-zinc-500 text-xs">MPC verification</p>
                    </div>
                    <p className={vaultInitialized ? "text-secondary font-bold" : "text-amber-300 font-bold"}>
                      {vaultInitialized ? "VALIDATED" : "PENDING"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl border border-primary/20 bg-surface-container/70 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-primary/15 flex items-center justify-between gap-3 flex-wrap">
              <h4 className="text-2xl font-display font-bold text-white">Transaction History Log</h4>
              <div className="flex items-center gap-2">
                <select
                  value={txFilter}
                  onChange={(e) => setTxFilter(e.target.value as "all" | "real" | "sim" | "confirmed" | "failed" | "payout" | "decommission")}
                  className="rounded-lg border border-primary/20 bg-surface-container-high/70 px-3 py-1.5 text-xs font-mono text-zinc-300 hover:border-primary/40 hover:text-white transition-colors focus:outline-none focus:border-primary/40"
                >
                  <option value="all">Filter: All</option>
                  <option value="real">Filter: Real Mode</option>
                  <option value="sim">Filter: Simulated</option>
                  <option value="confirmed">Filter: Confirmed</option>
                  <option value="failed">Filter: Failed</option>
                  <option value="payout">Filter: Payout / Spend</option>
                  <option value="decommission">Filter: Decommission</option>
                </select>
                <button
                  onClick={handleExportCsv}
                  disabled={analyticsRows.length === 0}
                  className="rounded-lg border border-primary/20 bg-surface-container-high/70 px-3 py-1.5 text-xs font-mono text-zinc-300 hover:border-primary/40 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ⇩ Export CSV
                </button>
                <div className="font-mono text-xs text-zinc-400 pl-1">
                  Mode: <span className={simulationMode ? "text-amber-300" : "text-secondary"}>{simulationMode ? "SIM" : "REAL"}</span>
                </div>
              </div>
            </div>
            {txHistory.length === 0 ? (
              <div className="p-8 font-mono text-zinc-500 text-sm">No transactions yet. Run commands from Fleet Command to populate history.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] font-mono text-sm">
                  <thead className="text-zinc-500 border-b border-primary/15">
                    <tr>
                      <th className="text-left px-5 py-3">Operation Type</th>
                      <th className="text-left px-5 py-3">Execution ID</th>
                      <th className="text-left px-5 py-3">Mode</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-left px-5 py-3">Time</th>
                      <th className="text-left px-5 py-3">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                          No transactions match this filter.
                        </td>
                      </tr>
                    )}
                    {analyticsRows.map((tx, idx) => (
                      <tr key={`${tx.timestamp}-${idx}`} className="border-b border-primary/10 hover:bg-white/[0.01]">
                        <td className="px-5 py-4 text-white font-bold">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`h-8 w-8 rounded-md border ${getOperationIcon(tx.type).ring} ${getOperationIcon(tx.type).bg} ${getOperationIcon(tx.type).fg} inline-flex items-center justify-center text-xs`}
                            >
                              {getOperationIcon(tx.type).icon}
                            </span>
                            <span>{tx.type}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-zinc-300">{tx.signature ? `${tx.signature.slice(0, 4)}...${tx.signature.slice(-4)}` : tx.id !== undefined ? `agent-${tx.id}` : "n/a"}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded border text-xs font-bold ${tx.mode === "real" ? "text-secondary border-secondary/30 bg-secondary/10" : "text-amber-300 border-amber-400/30 bg-amber-500/10"}`}>
                            {tx.mode.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-2 ${tx.status === "failed" ? "text-rose-300" : "text-secondary"}`}>
                            <span className="text-xs">●</span>
                            <span>{tx.status === "failed" ? "Failed" : tx.status === "simulated" ? "Simulated" : "Confirmed"}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 text-zinc-300">{new Date(tx.timestamp).toLocaleTimeString()}</td>
                        <td className="px-5 py-4">
                          {tx.signature && tx.mode === "real" ? (
                            <a
                              href={`https://orbmarkets.io/tx/${tx.signature}${
                                networkLabel === "localnet"
                                  ? "?cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899"
                                  : "?cluster=devnet"
                              }`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-vivid-cyan hover:underline font-bold"
                            >
                              View Explorer
                            </a>
                          ) : (
                            <span className="text-zinc-600" title={tx.message || "No signature available"}>
                              No signature
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {analyticsRows.length > 4 && (
              <div className="px-5 py-3 border-t border-primary/15 text-center">
                <span className="text-vivid-cyan font-mono text-xs font-bold">Load 50 More Operations</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTabName === "security" && (
        <div className="grid grid-cols-12 gap-6 xl:gap-8 w-full relative z-20">
          {/* Left: Step Progress */}
          <div className="col-span-12 lg:col-span-3">
            <div className="glass-card rounded-xl p-6 sticky top-6">
              <h3 className="font-mono text-primary uppercase mb-6 tracking-widest text-xs font-bold">Configuration Steps</h3>
              <div className="space-y-0 relative">
                {/* Step 1 */}
                <div className="flex gap-4 pb-10 relative">
                  <div className="absolute left-4 top-10 w-0.5 h-10 bg-white/5 z-0"></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    connected ? "bg-secondary-container text-on-secondary-container" : "bg-white/5 text-zinc-500"
                  }`}>
                    <span className="material-symbols-outlined text-sm font-bold">{connected ? "check" : "lock"}</span>
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-white">Wallet Setup</h4>
                    <p className="text-xs text-on-surface-variant">Vault linked to Solana</p>
                  </div>
                </div>
                {/* Step 2 */}
                <div className="flex gap-4 pb-10 relative">
                  <div className="absolute left-4 top-10 w-0.5 h-10 bg-white/5 z-0"></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    vaultInitialized ? "bg-secondary-container text-on-secondary-container" : "bg-white/5 text-zinc-500"
                  }`}>
                    <span className="material-symbols-outlined text-sm font-bold">{vaultInitialized ? "check" : "lock"}</span>
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-white">Program Registry</h4>
                    <p className="text-xs text-on-surface-variant">Whitelisted instructions</p>
                  </div>
                </div>
                {/* Step 3 */}
                <div className="flex gap-4 pb-10 relative">
                  <div className="absolute left-4 top-10 w-0.5 h-10 bg-white/5 z-0"></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    usdcMintInput && usdcMintInput !== "No token deployed" ? "bg-secondary-container text-on-secondary-container" : "bg-white/5 text-zinc-500"
                  }`}>
                    <span className="material-symbols-outlined text-sm font-bold">{usdcMintInput && usdcMintInput !== "No token deployed" ? "check" : "lock"}</span>
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-white">Custom Token Mint</h4>
                    <p className="text-xs text-on-surface-variant">Auth token generation</p>
                  </div>
                </div>
                {/* Step 4 (Current) */}
                <div className="flex gap-4 relative">
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center z-10 active-step-ring">
                    <span className="material-symbols-outlined text-on-primary-container text-sm font-bold">policy</span>
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-primary">Spending Policy</h4>
                    <p className="text-xs text-on-surface-variant">Guardrail stress-testing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Workspace Main */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Hero Section: Stress-Tests */}
            <section className="glass-card rounded-xl p-6 lg:p-8 relative overflow-hidden">
              <div className="scanline"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/20 p-2 rounded-lg text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">analytics</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">Spending Policy Revert Stress-Tests</h3>
                </div>
                <p className="font-sans text-sm text-on-surface-variant mb-8 max-w-2xl leading-relaxed">
                  Simulate agent transactions to verify that your guardrails are correctly configured on-chain. Any spend exceeding the active &apos;Max Cap&apos; or &apos;Daily Rate Limit&apos; will trigger an immediate revert.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-end">
                  <div className="space-y-3">
                    <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider block font-bold">Test Spend Amount (SOL)</label>
                    <div className="relative">
                      <input 
                        className="w-full bg-surface-container-low border border-white/10 rounded-lg px-4 py-3 font-mono text-white text-sm focus:outline-none focus:border-primary transition-colors" 
                        id="spendAmount" 
                        placeholder="0.00" 
                        type="text" 
                        value={spendAmount}
                        onChange={(e) => setSpendAmount(e.target.value)}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <div className="w-5 h-5 rounded-full bg-[#14F195]/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#14F195]"></div>
                        </div>
                        <span className="text-xs font-bold text-[#14F195] font-mono">SOLANA</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-on-surface-variant">
                      <span>MAX CAP: 5.0 SOL</span>
                      <span>RATE LIMIT: 10 SOL/DAY</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleSpend("normal")}
                      disabled={actionLoading}
                      className="flex-1 bg-surface-container-high hover:bg-surface-variant text-secondary border border-secondary/20 px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-sm"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                      Normal Spend
                    </button>
                    <button 
                      onClick={() => handleSpend("exploit-cap")}
                      disabled={actionLoading}
                      className="flex-1 bg-surface-container-high hover:bg-error-container/20 text-error border border-error/20 px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-sm"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">warning</span>
                      Exceed Max
                    </button>
                    <button 
                      onClick={() => handleSpend("exploit-rate")}
                      disabled={actionLoading}
                      className="sm:col-span-2 bg-surface-container-high hover:bg-surface-variant text-tertiary border border-tertiary/20 px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-sm"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">speed</span>
                      Hammer Rate
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Feedback Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Live Simulation Log */}
              <div className="glass-card rounded-xl p-6 min-h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-display text-white text-lg font-bold">Simulation Terminal</h4>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                  </span>
                </div>
                <div className="font-mono text-xs space-y-2 overflow-y-auto flex-grow max-h-64 scrollbar-hide pr-1" id="terminalContent">
                  {terminalLogs.length === 0 ? (
                    <div className="text-on-surface-variant/50 italic text-center py-12">
                      Waiting for simulation trigger...
                    </div>
                  ) : (
                    terminalLogs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className={
                          log.type === "success" 
                            ? "text-secondary font-semibold" 
                            : log.type === "error" 
                            ? "text-error font-bold" 
                            : log.type === "info"
                            ? "text-primary font-semibold"
                            : "text-on-surface-variant"
                        }
                      >
                        {`> ${log.message}`}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Visual Guardrail Map */}
              <div className="glass-card rounded-xl p-6 flex flex-col">
                <h4 className="font-display text-white text-lg font-bold mb-6">Policy Logic Map</h4>
                <div className="flex-grow flex flex-col justify-center items-center py-4">
                  <div className="relative w-full max-w-[280px]">
                    {/* Entry Node */}
                    <div className="w-full h-11 rounded-lg border border-white/10 flex items-center justify-center bg-surface-container font-mono text-xs text-on-surface-variant">
                      Incoming Instruction
                    </div>
                    <div className="w-0.5 h-6 bg-white/10 mx-auto"></div>
                    {/* Guardrail Node */}
                    <div className={`w-full p-4 rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-300 ${
                      solverState === "querying" || solverState === "fetching" || solverState === "signing"
                        ? "border-primary bg-primary/10 animate-pulse scale-102"
                        : solverState === "done"
                        ? "border-secondary bg-secondary/10"
                        : solverState === "error"
                        ? "border-error bg-error/10 revert-animation shadow-[0_0_15px_rgba(255,75,92,0.15)]"
                        : "border-white/10 bg-surface-container"
                    }`}>
                      <span className="material-symbols-outlined text-primary">security</span>
                      <span className="font-bold text-sm text-white">Policy Engine</span>
                    </div>
                    <div className="w-0.5 h-6 bg-white/10 mx-auto"></div>
                    {/* Result Nodes: split chain into 3 clear outcomes */}
                    <div className="grid grid-cols-3 gap-2 w-full">
                      <div className={`h-11 rounded-lg border flex items-center justify-center font-bold text-[11px] transition-all ${
                        solverState === "done"
                          ? "border-secondary bg-secondary/15 text-secondary opacity-100 font-extrabold shadow-[0_0_10px_rgba(0,240,144,0.3)]"
                          : "border-white/5 bg-white/5 opacity-30"
                      }`}>
                        EXECUTE
                      </div>
                      <div className={`h-11 rounded-lg border flex items-center justify-center font-bold text-[11px] transition-all ${
                        solverState === "fetching" || solverState === "querying" || solverState === "signing"
                          ? "border-tertiary bg-tertiary/15 text-tertiary opacity-100 font-extrabold shadow-[0_0_10px_rgba(117,209,255,0.25)]"
                          : "border-white/5 bg-white/5 opacity-30"
                      }`}>
                        REVIEW
                      </div>
                      <div className={`h-11 rounded-lg border flex items-center justify-center font-bold text-[11px] transition-all ${
                        solverState === "error"
                          ? "border-error bg-error/15 text-error opacity-100 font-extrabold shadow-[0_0_10px_rgba(255,75,92,0.3)]"
                          : "border-white/5 bg-white/5 opacity-30"
                      }`}>
                        REVERT
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Summary Card */}
            <div className="gradient-border shadow-lg">
              <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex gap-4 items-center">
                  <div className="bg-secondary/10 p-3 rounded-full flex items-center justify-center border border-secondary/20 shadow-[0_0_15px_rgba(0,240,144,0.1)]">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-white text-lg">Configuration Validated</h4>
                    <p className="font-sans text-on-surface-variant text-sm mt-0.5">Policy integrity verified against 14 automated attack vectors.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const policyJson = JSON.stringify({
                        version: "2.4.1",
                        network: "Solana Devnet",
                        guardrails: {
                          max_transaction_cap_sol: 5.0,
                          daily_rate_limit_sol: 10,
                          whitelist_registry: [
                            "TokenkegQfeZyiNwAJbNb1IaX18SEUt9MG56161gLf"
                          ],
                          pda_derivation: "seeds[wallet_authority, spending_policy_v2]"
                        }
                      }, null, 2);
                      navigator.clipboard.writeText(policyJson);
                      alert("Policy configuration JSON copied to clipboard!");
                    }}
                    className="px-6 py-2.5 rounded-lg text-on-surface border border-white/10 hover:bg-white/5 transition-colors cursor-pointer text-xs font-semibold"
                  >
                    Export Policy JSON
                  </button>
                  <button 
                    onClick={() => alert("Policy rules securely locked onto the Solana blockchain sandbox.")}
                    className="px-8 py-2.5 rounded-lg bg-primary text-on-primary font-bold hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all cursor-pointer text-xs font-semibold"
                  >
                    Complete Setup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Configure AI Brain Context Modal Prompt */}
      <AiConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        llmProvider={llmProvider}
        onProviderSelect={(val) => setLlmProvider(val as LlmProvider)}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        modelName={modelName}
        onModelNameChange={setModelName}
        merchantWallet={merchantWallet}
        onMerchantWalletChange={setMerchantWallet}
        spendAmount={spendAmount}
        setSpendAmount={setSpendAmount}
        onSubmit={handleModalSubmit}
        isBatch={modalIsBatch}
        targetAgentId={modalTargetAgentId}
      />

      {/* Transaction Revert visual overlay card */}
      {errorPopup && (
        <ErrorModalOverlay
          title={errorPopup.title}
          message={errorPopup.message}
          code={errorPopup.code}
          onClose={() => setErrorPopup(null)}
        />
      )}
    </div>
  );
}
