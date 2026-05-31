"use client";

import React, { useState } from "react";
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
    solverState,
    solverErrorMsg,
    confirmedTxSignature,
    faucetLoading,
    faucetStatus,
    terminalLogs,
    errorPopup,
    setErrorPopup,
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
    setModalIsBatch(true);
    setIsModalOpen(true);
  };

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
            isActive={currentStep === 5 || currentStep === 4} // Default open when fleet is active
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

      {/* Dynamic Configure AI Brain Context Modal Prompt */}
      <AiConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        llmProvider={llmProvider}
        onProviderSelect={(val) => setLlmProvider(val as any)}
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
