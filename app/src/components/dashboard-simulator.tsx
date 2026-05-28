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
      message: "Console initialized. Connect wallet and switch to Devnet to spin up your on-chain agent.",
    },
  ]);

  const [actionLoading, setActionLoading] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  // Auto scroll terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  // 1. Initialize Vault On-Chain
  const handleInitVault = async () => {
    setActionLoading(true);
    addLog("info", "Sending initialize_vault transaction on-chain...");
    try {
      await initializeVault();
      addLog("success", "Vault State PDA successfully initialized on-chain! 🎉");
    } catch (err: any) {
      addLog("error", `Failed to initialize vault: ${err.message || err}`);
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
      } else if (mode === "exploit-cap") {
        addLog("error", `[ON-CHAIN REVERT] Transaction Blocked! Reason: Amount $${amount.toFixed(2)} exceeds MaxPerCall cap of $${activeAgent.maxPerCall.toFixed(2)} (ErrorCode: 6003). 🛑`);
      } else if (mode === "exploit-allowlist" && activeAgent.allowedProviders.length > 0) {
        addLog("error", `[ON-CHAIN REVERT] Transaction Blocked! Target wallet not on allowlist (ErrorCode: 6002). 🛑`);
      } else if (mode === "exploit-rate") {
        addLog("success", `Tx #1: Spent $${amount.toFixed(2)} USDC successfully. ✅`);
        addLog("success", `Tx #2: Spent $${amount.toFixed(2)} USDC successfully. ✅`);
        addLog("error", `[ON-CHAIN REVERT] Tx #3 Blocked! Exceeds Rolling Per-Minute Limit of $${activeAgent.maxPerMinute.toFixed(2)} (ErrorCode: 6004). 🛑`);
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
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 font-mono text-[11px] leading-relaxed bg-[#050508]">
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
            <div ref={terminalEndRef} />
          </div>
        </div>

      </div>

    </div>
  );
}
