"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useAgentState, OnChainAgent } from "../hooks/use-agent-state";
import { useAnchorProgram } from "../hooks/use-anchor-program";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

interface LogLine {
  timestamp: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export default function DashboardSimulator() {
  const { connection } = useConnection();
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
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
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

  // Auto scroll terminal container only (fixes window scrolling bug!)
  useEffect(() => {
    const container = terminalContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [terminalLogs]);

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
    let msg = err.message || err.toString();
    let code = "On-Chain Error";
    
    // Map Anchor custom errors to user-friendly messages
    if (msg.includes("6000") || msg.includes("0x1770") || msg.includes("Overflow")) {
      msg = "Calculation overflowed inside the smart contract arithmetic checks.";
      code = "6000 (Overflow)";
    } else if (msg.includes("6001") || msg.includes("0x1771") || msg.includes("AgentNotActive") || msg.includes("PAUSED")) {
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
    } else if (msg.includes("custom program error: 0x0") || msg.includes("already in use")) {
      msg = "The Agent ID already exists or the PDA account has already been registered on-chain!";
      code = "0x0 (AccountAlreadyExists)";
    } else if (msg.includes("User rejected the request")) {
      msg = "Transaction cancelled: You rejected the signature request in your browser wallet.";
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
        <div className="glass-panel p-6 rounded-xl border border-electric-purple/30 bg-electric-purple/5 flex flex-col gap-4 relative overflow-hidden">
          {/* Subtle neon glow inside card background */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-electric-purple/10 blur-xl pointer-events-none" />
          
          <div className="flex justify-between items-center relative z-10">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-electric-purple">✨</span> ONE-CLICK AI VAULT DEMO
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-electric-purple/35 bg-electric-purple/10 text-electric-purple">
              Presentation Autopilot
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-mono relative z-10">
            Confused on how to start? Sit back and click play. The autopilot will automatically seed keys, request faucet SOL, initialize the vault PDA, register Agent #1, fund USDC, and execute standard API spends and malicious hack overrides live!
          </p>

          {autoRunning ? (
            <div className="flex flex-col gap-2 mt-2 relative z-10">
              <div className="flex justify-between text-xs font-mono text-zinc-300">
                <span>{currentStep}</span>
                <span className="text-electric-purple font-bold">{stepPercent}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-glass-border">
                <div 
                  className="bg-gradient-to-r from-electric-purple to-vivid-cyan h-full transition-all duration-500 shadow-glow-purple"
                  style={{ width: `${stepPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={runAutopilotDemo}
              disabled={actionLoading}
              className="py-3 px-4 rounded bg-electric-purple hover:bg-electric-purple/90 text-white font-bold font-mono text-sm transition-all shadow-glow-purple hover:scale-[1.01] mt-1 relative z-10 flex items-center justify-center gap-2"
            >
              <span>🚀</span> Start Autonomous Security Playback
            </button>
          )}
        </div>
        
        {/* Step 1: Initialize Vault Panel */}
        {!connected ? (
          <div className="glass-panel p-8 rounded-xl text-center flex flex-col gap-3">
            <h3 className="text-xl font-bold text-white font-mono">1. Connect Your Wallet</h3>
            <p className="text-sm text-zinc-400">
              Please connect your devnet wallet in the playground widget above to manage spending policies.
            </p>
          </div>
        ) : vaultInitialized === false ? (
          <div className="glass-panel p-8 rounded-xl flex flex-col gap-4 border border-vivid-cyan/25">
            <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <span>🏗️</span> Step 1: Initialize On-Chain Vault
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-mono">
              Your wallet does not have a registered Vault State account yet. Click the button below to initialize your global spending vault on-chain.
            </p>
            <button
              onClick={handleInitVault}
              disabled={actionLoading || loading}
              className="py-3 rounded bg-vivid-cyan text-black hover:bg-vivid-cyan/90 font-bold transition-all shadow-glow-cyan"
            >
              {actionLoading ? "Initializing Vault..." : "Initialize Vault State PDA"}
            </button>
          </div>
        ) : (
          <>
            {/* Step 2: Create Agent PDA config */}
            <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <span>🤖</span> Register Delegated Agent PDA
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase text-zinc-400">Agent ID (Numeric)</label>
                  <input
                    value={agentIdInput}
                    onChange={(e) => setAgentIdInput(e.target.value)}
                    type="number"
                    className="bg-white/5 border border-glass-border px-3 py-2 rounded text-sm text-white font-mono focus:outline-none focus:border-electric-purple"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase text-zinc-400">SOL Seed fee allocation</label>
                  <input
                    value={solSeedInput}
                    onChange={(e) => setSolSeedInput(e.target.value)}
                    type="text"
                    className="bg-white/5 border border-glass-border px-3 py-2 rounded text-sm text-white font-mono focus:outline-none focus:border-electric-purple"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase text-zinc-400">Single-Call Cap ($ USDC)</label>
                  <input
                    value={maxCallInput}
                    onChange={(e) => setMaxCallInput(e.target.value)}
                    type="text"
                    className="bg-white/5 border border-glass-border px-3 py-2 rounded text-sm text-white font-mono focus:outline-none focus:border-electric-purple"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-mono uppercase text-zinc-400">Per-Minute Rate ($ USDC)</label>
                  <input
                    value={maxMinuteInput}
                    onChange={(e) => setMaxMinuteInput(e.target.value)}
                    type="text"
                    className="bg-white/5 border border-glass-border px-3 py-2 rounded text-sm text-white font-mono focus:outline-none focus:border-electric-purple"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase text-zinc-400">Allowed Provider Wallet (Optional)</label>
                <input
                  value={allowedProviderInput}
                  onChange={(e) => setAllowedProviderInput(e.target.value)}
                  placeholder="e.g. OpenAI Gateway address"
                  type="text"
                  className="bg-white/5 border border-glass-border px-3 py-2 rounded text-sm text-white font-mono focus:outline-none focus:border-electric-purple"
                />
              </div>

              <button
                onClick={handleCreateAgent}
                disabled={actionLoading}
                className="py-2.5 rounded bg-electric-purple hover:bg-electric-purple/90 text-white font-bold transition-all mt-2 shadow-glow-purple"
              >
                {actionLoading ? "Registering on-chain..." : "Spawn Agent on Devnet"}
              </button>
            </div>

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
                    <div
                      key={agent.id}
                      onClick={() => setActiveTab(agent.id)}
                      className={`glass-panel p-5 rounded-xl flex flex-col gap-3 cursor-pointer ${
                        activeTab === agent.id ? "border-electric-purple/60 bg-electric-purple/5" : ""
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-electric-purple animate-pulse" />
                          <h4 className="font-mono font-bold text-white">Agent #{agent.id}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              agent.status === "Active"
                                ? "bg-success-emerald/10 border-success-emerald/20 text-success-emerald"
                                : "bg-emergency-red/10 border-emergency-red/20 text-emergency-red"
                            }`}
                          >
                            {agent.status}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePause(agent);
                            }}
                            className={`text-[10px] font-mono font-bold px-3 py-1 rounded border transition-all ${
                              agent.status === "Active"
                                ? "bg-emergency-red/10 border-emergency-red/30 text-emergency-red hover:bg-emergency-red/20"
                                : "bg-success-emerald/10 border-success-emerald/30 text-success-emerald hover:bg-success-emerald/20"
                            }`}
                          >
                            {agent.status === "Active" ? "Pause" : "Activate"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-400 mt-2">
                        <div>
                          PDA: <span className="text-zinc-200">{agent.publicKey.substring(0, 6)}...{agent.publicKey.substring(agent.publicKey.length - 6)}</span>
                        </div>
                        <div>
                          Hot-Key: <span className="text-zinc-200">{agent.signer.substring(0, 6)}...{agent.signer.substring(agent.signer.length - 6)}</span>
                        </div>
                        <div>
                          Limit/Call: <span className="text-white font-bold">${agent.maxPerCall.toFixed(2)} USDC</span>
                        </div>
                        <div>
                          Limit/Minute: <span className="text-white font-bold">${agent.maxPerMinute.toFixed(2)} USDC</span>
                        </div>
                      </div>

                      {/* Deposit funding inline widget */}
                      {activeTab === agent.id && (
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-glass-border">
                          <input
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            type="text"
                            className="bg-white/5 border border-glass-border px-3 py-1.5 rounded text-xs text-white font-mono max-w-[80px] focus:outline-none"
                          />
                          <span className="text-xs font-mono text-zinc-500">USDC</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeposit();
                            }}
                            disabled={actionLoading}
                            className="text-xs px-4 py-1.5 rounded bg-success-emerald hover:bg-success-emerald/90 text-white font-bold transition-all ml-auto"
                          >
                            Fund Vault
                          </button>
                        </div>
                      )}

                    </div>
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
        <div className="glass-panel p-5 rounded-xl flex flex-col gap-3 font-mono text-xs">
          <h4 className="font-bold text-white flex items-center gap-2">
            <span>🛡️</span> LOCAL SIMULATOR HOT-KEY
          </h4>
          <div className="p-3 rounded bg-white/5 border border-glass-border flex flex-col gap-1.5">
            <span className="text-zinc-400">Public Key:</span>
            <span className="text-vivid-cyan text-[11px] break-all select-all">
              {simulatedSigner ? simulatedSigner.publicKey.toBase58() : "Loading..."}
            </span>
          </div>
        </div>

        {/* Spend triggers */}
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
              onClick={() => handleSpend("normal")}
              disabled={actionLoading || !connected}
              className="py-2 px-3 rounded bg-zinc-800 hover:bg-zinc-700 font-mono text-xs text-left text-zinc-200 border border-glass-border transition-all flex justify-between"
            >
              <span>✅ Normal Spend Request</span>
              <span className="text-zinc-500">Under Limits</span>
            </button>
            <button
              onClick={() => handleSpend("exploit-cap")}
              disabled={actionLoading || !connected}
              className="py-2 px-3 rounded bg-emergency-red/10 hover:bg-emergency-red/20 font-mono text-xs text-left text-emergency-red border border-emergency-red/20 transition-all flex justify-between"
            >
              <span>🚨 Bypass Max Single-Call Cap</span>
              <span className="text-emergency-red/60">Should Revert</span>
            </button>
            <button
              onClick={() => handleSpend("exploit-rate")}
              disabled={actionLoading || !connected}
              className="py-2 px-3 rounded bg-emergency-red/10 hover:bg-emergency-red/20 font-mono text-xs text-left text-emergency-red border border-emergency-red/20 transition-all flex justify-between"
            >
              <span>🚨 Hammer Rate Limit (Spike)</span>
              <span className="text-emergency-red/60">Should Revert</span>
            </button>
            <button
              onClick={() => handleSpend("exploit-allowlist")}
              disabled={actionLoading || !connected}
              className="py-2 px-3 rounded bg-emergency-red/10 hover:bg-emergency-red/20 font-mono text-xs text-left text-emergency-red border border-emergency-red/20 transition-all flex justify-between"
            >
              <span>🚨 Spend to Unregistered Provider</span>
              <span className="text-emergency-red/60">Should Revert</span>
            </button>
          </div>
        </div>

        {/* Real-time scrollable Terminal logger */}
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
            {terminalLogs.map((log, idx) => (
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

      </div>

      {/* Floating Error Dialog Overlay Card */}
      {errorPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-emergency-red/30 shadow-2xl relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-emergency-red" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emergency-red/10 border border-emergency-red/20 flex items-center justify-center text-emergency-red font-mono text-xl font-bold">
                ⚠️
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-white font-mono">{errorPopup.title}</h3>
                {errorPopup.code && (
                  <span className="text-[10px] font-mono text-emergency-red/80 uppercase tracking-wider">
                    {errorPopup.code}
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-zinc-300 font-mono leading-relaxed bg-white/5 p-4 rounded border border-glass-border">
              {errorPopup.message}
            </p>

            <button
              onClick={() => setErrorPopup(null)}
              className="py-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold font-mono text-xs border border-glass-border transition-all mt-2 select-none"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
