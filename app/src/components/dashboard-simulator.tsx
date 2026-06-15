"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import FlowWalkthroughSlide from "./wizard/flow-walkthrough-slide";
import OrchestratorPanel from "./wizard/orchestrator-panel";

// Capstone Masterclass Premium components
import FleetTopologyMap from "./wizard/fleet-topology-map";
import CognitiveAuditPanel from "./wizard/cognitive-audit-panel";
import PerformanceTelemetry from "./wizard/performance-telemetry";
import DataStreamLedger from "./wizard/data-stream-ledger";

export default function DashboardSimulator() {
  const searchParams = useSearchParams();
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
    cerebrasKey,
    setCerebrasKey,
    geminiKey,
    setGeminiKey,
    mistralKey,
    setMistralKey,
    kimiKey,
    setKimiKey,
    deepseekKey,
    setDeepseekKey,
    openrouterKey,
    setOpenrouterKey,
    modelName,
    setModelName,
    merchantWallet,
    setMerchantWallet,
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

  const [activeTabName, setActiveTabName] = useState<"fleet" | "analytics" | "guide" | "orchestrator">("fleet");

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "guide") {
      setActiveTabName("guide");
    } else if (view === "analytics") {
      setActiveTabName("analytics");
    } else if (view === "orchestrator") {
      setActiveTabName("orchestrator");
    }
  }, [searchParams]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIsBatch, setModalIsBatch] = useState(false);
  const [modalTargetAgentId, setModalTargetAgentId] = useState(1);

  const activeAgent = agents.find((a) => a.id === activeTab);

  const isStep1Completed = connected && solBalance !== null && solBalance > 0;
  const isStep2Completed = vaultInitialized === true && agents.length > 0;
  const isStep3Completed = usdcMintInput !== "" && usdcMintInput !== "No token deployed";

  const handleOpenSingleSolverModal = (id: number) => {
    setModalTargetAgentId(id);
    setModalIsBatch(false);
    setIsModalOpen(true);
  };

  const handleOpenBatchSolverModal = () => {
    setModalIsBatch(true);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async () => {
    setIsModalOpen(false);
    if (modalIsBatch) {
      await handleBatchRunSolvers();
    } else {
      await handleLiveAISolveForAgent(modalTargetAgentId);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex border-b border-glass-border/30 gap-6 mb-2 relative z-20 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTabName("fleet")}
          className={"pb-2.5 font-mono text-xs font-bold tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-1.5 focus:outline-none whitespace-nowrap " + (activeTabName === "fleet" ? "border-electric-purple text-white shadow-[0_4px_10px_rgba(147,51,234,0.15)] font-black" : "border-transparent text-zinc-500 hover:text-zinc-300")}
        >
          <span>🛰️</span> FLEET COMMAND
        </button>
        <button
          onClick={() => setActiveTabName("orchestrator")}
          className={"pb-2.5 font-mono text-xs font-bold tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-1.5 focus:outline-none whitespace-nowrap " + (activeTabName === "orchestrator" ? "border-electric-purple text-white shadow-[0_4px_10px_rgba(147,51,234,0.15)] font-black" : "border-transparent text-zinc-500 hover:text-zinc-300")}
        >
          <span>🎖️</span> ORCHESTRATOR
        </button>
        <button
          onClick={() => setActiveTabName("analytics")}
          className={"pb-2.5 font-mono text-xs font-bold tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-1.5 focus:outline-none whitespace-nowrap " + (activeTabName === "analytics" ? "border-electric-purple text-white shadow-[0_4px_10px_rgba(147,51,234,0.15)] font-black" : "border-transparent text-zinc-500 hover:text-zinc-300")}
        >
          <span>🧠</span> DIAGNOSTICS
        </button>
        <button
          onClick={() => setActiveTabName("guide")}
          className={"pb-2.5 font-mono text-xs font-bold tracking-wider cursor-pointer border-b-2 transition-all flex items-center gap-1.5 focus:outline-none whitespace-nowrap " + (activeTabName === "guide" ? "border-electric-purple text-white shadow-[0_4px_10px_rgba(147,51,234,0.15)] font-black" : "border-transparent text-zinc-500 hover:text-zinc-300")}
        >
          <span>📖</span> FLOW GUIDE
        </button>
      </div>

      {activeTabName === "fleet" ? (
        <>
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
            <div className="lg:col-span-7 flex flex-col gap-5">
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
                isActive={currentStep === 2}
                isCompleted={isStep2Completed}
                onToggle={() => handleToggleStep(2)}
              />
              <StepTokenDeposit
                usdcMintInput={usdcMintInput}
                setUsdcMintInput={setUsdcMintInput}
                actionLoading={actionLoading}
                onDeployCustomMint={handleCreateCustomMint}
                isActive={currentStep === 3}
                isCompleted={isStep3Completed}
                onToggle={() => handleToggleStep(3)}
              />
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
            <div className="lg:col-span-5 flex flex-col gap-6">
              <StatusMonitor
                connected={connected}
                walletAddress={walletAddress}
                solBalance={solBalance}
                activeAgent={activeAgent}
                usdcMint={usdcMintInput}
                simulatedSignerPubKey={simulatedSigner ? simulatedSigner.publicKey.toBase58() : ""}
              />
              <AgentTerminal logs={terminalLogs} />
            </div>
          </div>
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
      ) : activeTabName === "analytics" ? (
        <div className="w-full flex flex-col gap-8 relative z-20">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <FleetTopologyMap
                agents={agents}
                activeAgentId={activeTab}
                solverState={solverState}
                agentSolverStates={agentSolverStates}
                onSelectAgent={setActiveTab}
              />
              <CognitiveAuditPanel
                activeAgentId={activeTab}
                telemetry={cognitiveTelemetry[activeTab]}
              />
            </div>
            <div className="lg:col-span-5 flex flex-col gap-6">
              <PerformanceTelemetry
                agents={agents}
                txHistory={txHistory}
              />
              <div className="glass-panel p-5 rounded-xl border border-glass-border bg-black/45 shadow-2xl flex flex-col gap-3 font-mono">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🤖</span> SECURE AUTOPILOT ACTIVE SYSTEMS
                </h4>
                <p className="text-[10px] text-zinc-400">
                  Cognitive telemetry rates and RPC sweeps are fully delegated to individual PDAs. Live spending budgets are protected by sandboxed security policies on the Solana Devnet blockchain.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1 text-[9px] text-zinc-500 uppercase font-bold">
                  <div className="p-2 bg-black/25 border border-glass-border/20 rounded">
                    Status: <span className="text-success-emerald">ONLINE</span>
                  </div>
                  <div className="p-2 bg-black/25 border border-glass-border/20 rounded">
                    Vault PDA: <span className="text-white select-all">CONNECTED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DataStreamLedger agents={agents} dataFeeds={dataFeeds} />
        </div>
      ) : activeTabName === "guide" ? (
        <div className="w-full flex flex-col gap-6 relative z-20 max-w-4xl mx-auto py-4">
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-xl font-bold font-mono text-white tracking-tight uppercase text-center md:text-left">
              SolAgent Vault Protocol Flow
            </h2>
            <p className="text-xs text-zinc-400 font-mono text-center md:text-left">
              Understand the core mechanics of HTTP 402 on-chain payments and spending guardrails.
            </p>
          </div>
          <FlowWalkthroughSlide />
          <div className="glass-panel p-6 rounded-xl border border-glass-border bg-black/30 font-mono">
             <h4 className="text-xs font-bold text-vivid-cyan mb-2 uppercase tracking-widest">Architectural Note:</h4>
             <p className="text-[11px] text-zinc-400 leading-relaxed">
               The SolAgent Vault is designed for zero-trust environments. By isolating agent funds into individual PDAs (Program Derived Addresses), you ensure that even a compromised AI model cannot drain your main treasury. Each transaction is verified by the Solana runtime against your immutable on-chain policies.
             </p>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-6 relative z-20">
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-xl font-bold font-mono text-white tracking-tight uppercase">
              Multi-Agent AI Orchestrator
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Provision hierarchical agent fleets with delegated on-chain budgets and watchdog security monitoring.
            </p>
          </div>
          <OrchestratorPanel />
        </div>
      )}

      <AiConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        llmProvider={llmProvider}
        onProviderSelect={(val) => setLlmProvider(val)}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        cerebrasKey={cerebrasKey}
        onCerebrasKeyChange={setCerebrasKey}
        geminiKey={geminiKey}
        onGeminiKeyChange={setGeminiKey}
        mistralKey={mistralKey}
        onMistralKeyChange={setMistralKey}
        kimiKey={kimiKey}
        onKimiKeyChange={setKimiKey}
        deepseekKey={deepseekKey}
        onDeepseekKeyChange={setDeepseekKey}
        openrouterKey={openrouterKey}
        onOpenrouterKeyChange={setOpenrouterKey}
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
