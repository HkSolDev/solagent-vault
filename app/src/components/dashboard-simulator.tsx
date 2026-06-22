"use client";

import React, { useMemo, useState } from "react";
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
import CognitiveAuditPanel from "./wizard/cognitive-audit-panel";
import PerformanceTelemetry from "./wizard/performance-telemetry";
import DataStreamLedger from "./wizard/data-stream-ledger";

type LlmProvider = "gemini" | "openrouter" | "ollama" | "mock" | "auto";

export default function DashboardSimulator() {
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
    cognitiveTelemetry,
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
  const [activeTabName, setActiveTabName] = useState<"fleet" | "analytics">("fleet");

  // Contextual AI Selector modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIsBatch, setModalIsBatch] = useState(false);
  const [modalTargetAgentId, setModalTargetAgentId] = useState(1);

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
      <div className="flex border-b border-glass-border/30 gap-6 mb-2 relative z-20">
        <button
          onClick={() => setActiveTabName("fleet")}
          className={`pb-2.5 font-mono text-xs font-bold tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-1.5 focus:outline-none ${
            activeTabName === "fleet"
              ? "border-electric-purple text-white shadow-[0_4px_10px_rgba(147,51,234,0.15)] font-black"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span>🛰️</span> FLEET COMMAND CONSOLE
        </button>
        <button
          onClick={() => setActiveTabName("analytics")}
          className={`pb-2.5 font-mono text-xs font-bold tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-1.5 focus:outline-none ${
            activeTabName === "analytics"
              ? "border-electric-purple text-white shadow-[0_4px_10px_rgba(147,51,234,0.15)] font-black"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span>🧠</span> COGNITIVE DIAGNOSTICS & ANALYTICS
        </button>
      </div>

      {activeTabName === "fleet" ? (
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
            />
          )}
        </>
      ) : (
        <div className="w-full flex flex-col gap-8 relative z-20">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: SVG network graph and prompt debuggers */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <FleetTopologyMap
                agents={agents}
                activeAgentId={activeTab}
                solverState={solverState}
                agentSolverStates={agentSolverStates}
                serverNodes={dynamicServerNodes}
                onSelectAgent={setActiveTab}
              />
              
              <CognitiveAuditPanel
                activeAgentId={activeTab}
                telemetry={cognitiveTelemetry[activeTab]}
              />
            </div>

            {/* RIGHT COLUMN: Live Velocity Gauges and Explorer lists */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <PerformanceTelemetry
                agents={agents}
                txHistory={txHistory}
                simulationMode={simulationMode}
              />
              
              {/* Quick Autopilot details card */}
              <div className="glass-panel p-5 rounded-xl border border-glass-border bg-black/45 shadow-2xl flex flex-col gap-3 font-mono">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🤖</span> SECURE AUTOPILOT ACTIVE SYSTEMS
                </h4>
                <p className="text-[10px] text-zinc-400">
                  Live metrics shown above are derived from your runtime transaction history and solver telemetry in this session.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1 text-[9px] text-zinc-500 uppercase font-bold">
                  <div className="p-2 bg-black/25 border border-glass-border/20 rounded">
                    Status: <span className={agents.length > 0 ? "text-success-emerald" : "text-zinc-300"}>{agents.length > 0 ? "ONLINE" : "IDLE"}</span>
                  </div>
                  <div className="p-2 bg-black/25 border border-glass-border/20 rounded">
                    Vault PDA: <span className="text-white select-all">{vaultInitialized ? "CONNECTED" : "NOT INITIALIZED"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width premium Bilateral Client-to-Backend data ledger */}
          <DataStreamLedger agents={agents} dataFeeds={dataFeeds} />
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
