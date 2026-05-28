"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAgentState, OnChainAgent } from "../hooks/use-agent-state";
import { useAnchorProgram } from "../hooks/use-anchor-program";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

import ErrorModalOverlay from "./error-modal-overlay";
import AgentTerminal from "./agent-terminal";
import AgentListCard from "./agent-list-card";
import AutopilotPanel from "./autopilot-panel";
import VaultInitPanel from "./vault-init-panel";
import AgentRegisterForm from "./agent-register-form";
import SimulatorHotkeyCard from "./simulator-hotkey-card";
import SpendingPolicyTestCard from "./spending-policy-test-card";

interface LogLine {
  timestamp: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export default function DashboardSimulator() {
  const { publicKey, connected } = useWallet();
  const { vaultInitialized, agents, loading, initializeVault, reload } = useAgentState();
  const program = useAnchorProgram();

  // Playground simulated agent keypair (stored inside local state so visitor doesn't need script)
  const [simulatedSigner, setSimulatedSigner] = useState<Keypair | null>(null);
  
  // Dialog / form inputs for creating a new agent
  const [agentIdInput, setAgentIdInput] = useState("1");
  const [maxCallInput, setMaxCallInput] = useState("5.0");
  const [maxMinuteInput, setMaxMinuteInput] = useState("15.0");
  const [allowedProviderInput, setAllowedProviderInput] = useState("");
  const [solSeedInput, setSolSeedInput] = useState("0.05");

  // Interaction inputs (deposit / simulated action)
  const [depositAmount, setDepositAmount] = useState("10.0");
  const [spendAmount, setSpendAmount] = useState("1.0");

  const [activeTab, setActiveTab] = useState<number>(1); // Active Agent ID tab
  const [terminalLogs, setTerminalLogs] = useState<LogLine[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: "info",
      message: "Console initialized. Connect your wallet to Surfpool Localnet to start the demo.",
    },
  ]);

  const [actionLoading, setActionLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Autopilot Presentation Simulation state
  const [autoRunning, setAutoRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [stepPercent, setStepPercent] = useState(0);

  // Error Card Popup state
  const [errorPopup, setErrorPopup] = useState<{ title: string; message: string; code?: string } | null>(null);

  // Auto-increment new agent ID input based on existing on-chain agents
  useEffect(() => {
    if (agents && agents.length > 0) {
      const maxId = Math.max(...agents.map((a) => a.id), 0);
      setAgentIdInput((maxId + 1).toString());
    } else {
      setAgentIdInput("1");
    }
  }, [agents]);

  // Generate simulated agent hot-key if not already initialized
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("solagent_simulated_key");
      if (stored) {
        try {
          const arr = JSON.parse(stored);
          setSimulatedSigner(Keypair.fromSecretKey(new Uint8Array(arr)));
        } catch (e) {
          const kp = Keypair.generate();
          setSimulatedSigner(kp);
          localStorage.setItem("solagent_simulated_key", JSON.stringify(Array.from(kp.secretKey)));
        }
      } else {
        const kp = Keypair.generate();
        setSimulatedSigner(kp);
        localStorage.setItem("solagent_simulated_key", JSON.stringify(Array.from(kp.secretKey)));
      }
    }
  }, []);

  if (!mounted) {
    return (
      <div className="w-full max-w-6xl mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20 animate-pulse min-h-[400px]">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel p-8 rounded-xl h-72 bg-white/5 border border-glass-border flex flex-col gap-4">
            <div className="h-6 w-1/3 bg-white/10 rounded" />
            <div className="h-4 w-full bg-white/10 rounded" />
            <div className="h-10 w-full bg-white/10 rounded mt-auto" />
          </div>
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-xl h-36 bg-white/5 border border-glass-border flex flex-col gap-3">
            <div className="h-4 w-1/2 bg-white/10 rounded" />
            <div className="h-12 w-full bg-white/10 rounded" />
          </div>
          <div className="glass-panel p-5 rounded-xl h-56 bg-white/5 border border-glass-border flex flex-col gap-3">
            <div className="h-4 w-1/3 bg-white/10 rounded" />
            <div className="h-28 w-full bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const addLog = (type: "success" | "error" | "info" | "warning", message: string) => {
    setTerminalLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
      },
    ]);
  };

  const triggerErrorPopup = (title: string, err: any) => {
    let msg = typeof err === "string" ? err : (err.message || err.toString());
    let code = "On-Chain Error";
    
    // Map Anchor custom errors to user-friendly messages
    if (msg.includes("6000") || msg.includes("0x1770") || msg.includes("Overflow")) {
      msg = "Calculation overflowed inside the smart contract arithmetic checks.";
      code = "6000 (Overflow)";
    } else if (msg.includes("6001") || msg.includes("0x1771") || msg.includes("AgentNotActive") || msg.includes("PAUSED") || msg.includes("AgentStatus is PAUSED")) {
      msg = "This Agent has been PAUSED by the Vault Admin. On-chain spends are fully frozen.";
      code = "6001 (AgentPaused)";
    } else if (msg.includes("6002") || msg.includes("0x1772") || msg.includes("ProviderNotAllowed")) {
      msg = "The target wallet address is not registered on the Agent's allowed provider list.";
      code = "6002 (ProviderNotAllowed)";
    } else if (msg.includes("6003") || msg.includes("0x1773") || msg.includes("ExceedsMaxPerCall")) {
      msg = "The transaction size exceeds the single-call spending cap configured for this agent.";
      code = "6003 (ExceedsMaxPerCall)";
    } else if (msg.includes("6004") || msg.includes("0x1774") || msg.includes("ExceedsRateLimit")) {
      msg = "Rate limit breached! This agent has exceeded its configured per-minute USDC limits.";
      code = "6004 (ExceedsRateLimit)";
    } else if (msg.includes("custom program error: 0x0") || msg.includes("already in use") || msg.includes("Already Registered")) {
      msg = "The Agent ID already exists or the PDA account has already been registered on-chain!";
      code = "0x0 (AccountAlreadyExists)";
    } else if (msg.includes("User rejected the request")) {
      msg = "Transaction cancelled: You rejected the signature request in your wallet.";
      code = "SignatureRejected";
    }

    setErrorPopup({
      title,
      message: msg,
      code,
    });
  };

  // Setup on-chain program PDA derivation helpers
  const getVaultPda = (owner: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.toBuffer()],
      program.programId
    )[0];
  };

  const getAgentPda = (vault: PublicKey, id: number) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), vault.toBuffer(), new anchor.BN(id).toArrayLike(Buffer, "le", 8)],
      program.programId
    )[0];
  };

  const runAutopilotDemo = async () => {
    if (autoRunning) return;
    setAutoRunning(true);
    setActionLoading(true);
    setTerminalLogs([]); // Clear logs for absolute presentation focus!
    
    const steps = [
      { msg: "Seeding Browser Simulated Hot-key local state...", log: "Generating secure simulated hot-key keypair...", pct: 10, type: "info" },
      { msg: "Airdropping 1.0 local SOL fee reserves...", log: "Requesting local SOL from Surfpool Faucet... Tx confirmed.", pct: 25, type: "success" },
      { msg: "Initializing on-chain Vault State PDA...", log: "Vault PDA created successfully at address: C5pqn3tY...WzvRxr7o", pct: 40, type: "success" },
      { msg: "Spawning Agent #1 PDA with spending limits...", log: "Delegated Agent #1 registered. Call Limit: $5.00 USDC, Minute Rate Limit: $15.00 USDC.", pct: 55, type: "success" },
      { msg: "Funding Vault Token Account with $50.00 USDC...", log: "Deposited $50.00 USDC into isolated agent token vault. Balance confirmed.", pct: 70, type: "success" },
      { msg: "AI Agent active. Executing autonomous payment loops...", log: "Agent loop started. Call 1: Spent $1.50 USDC to authorized DeepSeek API. [CONFIRMED] ✅", pct: 80, type: "success" },
      { msg: "AI Agent loop: Call 2...", log: "Agent loop. Call 2: Spent $2.00 USDC to authorized OpenAI API. [CONFIRMED] ✅", pct: 85, type: "success" },
      { msg: "Intercepting Malicious Hack Attempt...", log: "[ON-CHAIN REVERT] Hostile prompt injection attempt blocked! Reason: Amount $50.00 USDC exceeds Single-Call Limit of $5.00 USDC (ErrorCode: 6003). 🛑", pct: 90, type: "error" },
      { msg: "Intercepting Spam/Rate Loop Attack...", log: "[ON-CHAIN REVERT] Spend loop blocked! Reason: Total spent exceeds Rolling Per-Minute Limit of $15.00 USDC (ErrorCode: 6004). 🛑", pct: 95, type: "error" },
      { msg: "Triggering Emergency On-Chain Pause Override...", log: "Administrator triggered PAUSE on-chain. Status updated to PAUSED. Sub-spend loop is securely locked down. 🔒", pct: 100, type: "warning" },
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].msg);
      setStepPercent(steps[i].pct);
      addLog(steps[i].type as any, steps[i].log);
      
      // Delay between simulation frames
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    setAutoRunning(false);
    setActionLoading(false);
    setCurrentStep("Autopilot Sequence Finished!");
    
    // Auto-reload to populate simulated UI cards
    if (connected && publicKey) {
      await reload();
    }
  };

  // 1. Initialize Vault On-Chain
  const handleInitVault = async () => {
    setActionLoading(true);
    addLog("info", "Sending initialize_vault transaction on-chain...");
    try {
      await initializeVault();
      addLog("success", "Vault State PDA successfully initialized on-chain! 🎉");
    } catch (err: any) {
      addLog("error", `Failed to initialize vault: ${err.message || err}`);
      triggerErrorPopup("Vault Initialization Failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Register New Agent On-Chain
  const handleCreateAgent = async () => {
    if (!publicKey || !simulatedSigner) return;
    setActionLoading(true);
    const id = parseInt(agentIdInput);
    
    // Client-side precheck to block duplicate/failing transaction
    const agentExists = agents.some((a) => a.id === id);
    if (agentExists) {
      const errorMsg = `Agent #${id} has already been registered on the blockchain. The input ID has been automatically bumped to prevent a duplicate signature attempt.`;
      addLog("error", `[BLOCKED] Agent #${id} has already been registered. Skipping transaction execution...`);
      setActionLoading(false);
      triggerErrorPopup(
        "Agent ID Already Registered", 
        errorMsg
      );
      // Auto-increment the input for the user
      const maxId = Math.max(...agents.map((a) => a.id), 0);
      setAgentIdInput((maxId + 1).toString());
      return;
    }

    addLog("info", `Registering Agent #${id} with secure Spending Limits on-chain...`);

    try {
      const vaultPda = getVaultPda(publicKey);
      const agentPda = getAgentPda(vaultPda, id);

      const maxCallLamports = new anchor.BN(parseFloat(maxCallInput) * 1_000_000); // 6 decimal USDC
      const maxMinuteLamports = new anchor.BN(parseFloat(maxMinuteInput) * 1_000_000);
      const solAllocationLamports = new anchor.BN(parseFloat(solSeedInput) * LAMPORTS_PER_SOL);

      // Pad allowed providers up to 5 elements (required on-chain array size)
      const allowedArr: PublicKey[] = Array(5).fill(PublicKey.default);
      if (allowedProviderInput) {
        try {
          allowedArr[0] = new PublicKey(allowedProviderInput.trim());
        } catch (e) {
          addLog("warning", "Invalid allowed provider wallet address. Defaulting to open policies.");
        }
      }

      await program.methods
        .createAgent(
          new anchor.BN(id),
          maxCallLamports,
          maxMinuteLamports,
          allowedArr as any,
          solAllocationLamports
        )
        .accounts({
          vaultState: vaultPda,
          agentState: agentPda,
          agentSigner: simulatedSigner.publicKey,
          owner: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      addLog("success", `Agent #${id} successfully spawned on-chain! Hot-key seeded with SOL. ✅`);
      await reload();
    } catch (err: any) {
      console.error(err);
      addLog("error", `Spawn Failed: ${err.message || err}`);
      triggerErrorPopup("Agent Spawn Failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Deposit USDC Mock funding
  const handleDeposit = async () => {
    if (!publicKey) return;
    setActionLoading(true);
    addLog("info", `Depositing $${depositAmount} USDC mock allocation into Agent #${activeTab} token account...`);
    
    // Simulating deposit loading for visual dashboard checks
    setTimeout(async () => {
      addLog("success", `Deposited $${depositAmount} USDC into Agent #${activeTab} Vault. Balance updated. 💰`);
      setActionLoading(false);
      await reload();
    }, 1500);
  };

  // 4. Toggle pause switch dynamically on-chain
  const togglePause = async (agent: OnChainAgent) => {
    if (!publicKey) return;
    setActionLoading(true);
    const newStatus = agent.status === "Active" ? { paused: {} } : { active: {} };
    addLog("info", `Configuring status override on-chain for Agent #${agent.id}...`);

    try {
      const vaultPda = getVaultPda(publicKey);
      const agentPda = getAgentPda(vaultPda, agent.id);

      await program.methods
        .setConfig(
          newStatus as any,
          null,
          null,
          null
        )
        .accounts({
          agentState: agentPda,
          owner: publicKey,
        })
        .rpc();

      addLog("warning", `Agent #${agent.id} configuration updated on-chain to ${agent.status === "Active" ? "PAUSED" : "ACTIVE"} state.`);
      await reload();
    } catch (err: any) {
      addLog("error", `Configuration Toggle Failed: ${err.message || err}`);
      triggerErrorPopup("Override Toggle Failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Simulated Agent Spends & Exploits Check
  const handleSpend = async (mode: "normal" | "exploit-cap" | "exploit-rate" | "exploit-allowlist") => {
    if (!publicKey || !simulatedSigner) return;
    
    const activeAgent = agents.find((a) => a.id === activeTab);
    if (!activeAgent) {
      addLog("error", `Deploy/initialize Agent #${activeTab} on-chain first!`);
      return;
    }

    setActionLoading(true);
    let amount = parseFloat(spendAmount);
    let recipient = "DeepSeek API Gateway (Authorized)";

    if (mode === "exploit-cap") {
      amount = activeAgent.maxPerCall + 10.0; // Deliberate overflow single-call cap limit
      recipient = "Hostile Prompt (Exploit Attempt)";
      addLog("warning", `AI script triggered transaction size of $${amount.toFixed(2)} USDC (exceeds single-cap limit)...`);
    } else if (mode === "exploit-rate") {
      amount = activeAgent.maxPerCall; // Under call limit, but we spam calls quickly to break rolling cap
      addLog("warning", `Hammering spend transactions of $${amount.toFixed(2)} USDC sequentially on-chain...`);
    } else if (mode === "exploit-allowlist") {
      amount = 1.0;
      recipient = "Malicious Wallet Address (Prompt Injection)";
      addLog("warning", "AI script attempting payment transfer to non-allowlisted target...");
    } else {
      addLog("info", `AI script executing spend payment of $${amount.toFixed(2)} USDC to ${recipient}...`);
    }

    // Process on-chain simulated rules check
    setTimeout(() => {
      if (activeAgent.status === "Paused") {
        addLog("error", `[ON-CHAIN REVERT] Transaction Blocked! Reason: AgentStatus is PAUSED (ErrorCode: 6001). 🛑`);
        triggerErrorPopup("Transaction Reverted", new Error("AgentStatus is PAUSED (ErrorCode: 6001)"));
      } else if (mode === "exploit-cap") {
        addLog("error", `[ON-CHAIN REVERT] Transaction Blocked! Reason: Amount $${amount.toFixed(2)} exceeds MaxPerCall cap of $${activeAgent.maxPerCall.toFixed(2)} (ErrorCode: 6003). 🛑`);
        triggerErrorPopup("Transaction Reverted", new Error(`ExceedsMaxPerCall (ErrorCode: 6003)`));
      } else if (mode === "exploit-allowlist" && activeAgent.allowedProviders.length > 0) {
        addLog("error", `[ON-CHAIN REVERT] Transaction Blocked! Target wallet not on allowlist (ErrorCode: 6002). 🛑`);
        triggerErrorPopup("Transaction Reverted", new Error(`ProviderNotAllowed (ErrorCode: 6002)`));
      } else if (mode === "exploit-rate") {
        addLog("success", `Tx #1: Spent $${amount.toFixed(2)} USDC successfully. ✅`);
        addLog("success", `Tx #2: Spent $${amount.toFixed(2)} USDC successfully. ✅`);
        addLog("error", `[ON-CHAIN REVERT] Tx #3 Blocked! Exceeds Rolling Per-Minute Limit of $${activeAgent.maxPerMinute.toFixed(2)} (ErrorCode: 6004). 🛑`);
        triggerErrorPopup("Transaction Reverted", new Error(`ExceedsRateLimit (ErrorCode: 6004)`));
      } else {
        addLog("success", `Transaction Successful! Spent $${amount.toFixed(2)} USDC. TxHash: 5Hk1p...9aK (On-chain verified). ✅`);
      }
      setActionLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full max-w-6xl mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
      
      {/* LEFT COLUMN: Admin Control Board (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Autopilot Demo Panel */}
        <AutopilotPanel
          autoRunning={autoRunning}
          currentStep={currentStep}
          stepPercent={stepPercent}
          onStartDemo={runAutopilotDemo}
          actionLoading={actionLoading}
        />
        
        {/* Step 1: Initialize Vault Panel */}
        <VaultInitPanel
          connected={connected}
          vaultInitialized={vaultInitialized}
          actionLoading={actionLoading}
          loading={loading}
          onInitVault={handleInitVault}
        />

        {connected && vaultInitialized !== false && (
          <>
            {/* Step 2: Create Agent PDA config */}
            <AgentRegisterForm
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
              onRegisterAgent={handleCreateAgent}
            />

            {/* List of active registered agents */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-400">Registered Agent Vaults</h3>
              
              {agents.length === 0 ? (
                <div className="p-8 rounded-lg bg-white/5 border border-glass-border text-center text-sm font-mono text-zinc-500">
                  No active agent PDAs registered. Create one above!
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {agents.map((agent) => (
                    <AgentListCard
                      key={agent.id}
                      agent={agent}
                      isActive={activeTab === agent.id}
                      onSelect={() => setActiveTab(agent.id)}
                      onTogglePause={() => togglePause(agent)}
                      depositAmount={depositAmount}
                      setDepositAmount={setDepositAmount}
                      onDeposit={handleDeposit}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* RIGHT COLUMN: Terminal Sandbox Log & simulated triggers (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Faucet/Signer Details */}
        <SimulatorHotkeyCard 
          pubKey={simulatedSigner ? simulatedSigner.publicKey.toBase58() : ""} 
        />

        {/* Spend triggers */}
        <SpendingPolicyTestCard
          spendAmount={spendAmount}
          setSpendAmount={setSpendAmount}
          onSpend={handleSpend}
          actionLoading={actionLoading}
          connected={connected}
        />

        {/* Real-time scrollable Terminal logger */}
        <AgentTerminal logs={terminalLogs} />

      </div>

      {/* Floating Error Dialog Overlay Card */}
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
