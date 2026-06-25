"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useAgentState, OnChainAgent } from "./use-agent-state";
import { useAnchorProgram } from "./use-anchor-program";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SendTransactionError, Transaction, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getMint,
  MINT_SIZE,
} from "@solana/spl-token";

interface LogLine {
  timestamp: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export interface TxHistoryItem {
  type: string;
  id?: number;
  signature?: string;
  timestamp: number;
  serverLabel?: string;
  mode: "real" | "sim";
  status: "confirmed" | "simulated" | "failed";
  balanceBefore?: number;
  balanceAfter?: number;
  delta?: number;
  message?: string;
}

type LlmProvider = "gemini" | "openrouter" | "ollama" | "mock" | "auto";

interface DataFeedItem {
  timestamp: number;
  agentId: number;
  feedType: string;
  payload: string;
  cost: number;
  size: number;
  serverLabel: string;
  providerLabel: LlmProvider;
}

const SERVER_POOLS: Record<Exclude<LlmProvider, "auto">, string[]> = {
  openrouter: ["OpenRouter Gateway", "DeepSeek Edge Node", "Mimo Router", "Anthropic Relay"],
  gemini: ["Gemini Primary", "Gemini Flash Region-A", "Gemini Flash Region-B", "Vertex Relay"],
  ollama: ["Local Ollama Node", "GPU Box A", "GPU Box B", "Inference Edge"],
  mock: ["Simulation Node"],
};

export function useSimulatorState() {
  const AUTO_FUND_NEW_AGENT_TOKENS = "1000.0";

  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { connection } = useConnection();
  const { vaultInitialized, agents: onChainAgents, loading, initializeVault, reload } = useAgentState();
  const [localAgentOverrides, setLocalAgentOverrides] = useState<Record<number, Partial<OnChainAgent>>>({});
  const [localDeletedAgentIds, setLocalDeletedAgentIds] = useState<number[]>([]);

  // Computed state combining on-chain and local optimistic overrides
  const agents = useMemo(() => {
    let list = [...onChainAgents];
    
    // Apply overrides
    list = list.map(agent => {
      const override = localAgentOverrides[agent.id];
      if (override) {
        return { ...agent, ...override };
      }
      return agent;
    });
    
    // Add locally created but not yet on-chain agents
    Object.keys(localAgentOverrides).forEach(idStr => {
      const id = parseInt(idStr);
      if (!list.some(a => a.id === id) && !localDeletedAgentIds.includes(id)) {
        const override = localAgentOverrides[id];
        if (override && override.publicKey && override.signer) {
          list.push({
            id,
            publicKey: override.publicKey,
            signer: override.signer,
            balance: override.balance ?? 0,
            maxPerCall: override.maxPerCall ?? 0,
            maxPerMinute: override.maxPerMinute ?? 0,
            status: override.status ?? "Active",
            allowedProviders: override.allowedProviders ?? [],
          });
        }
      }
    });
    
    // Filter out deleted agents
    list = list.filter(a => !localDeletedAgentIds.includes(a.id));
    
    return list.sort((a, b) => a.id - b.id);
  }, [onChainAgents, localAgentOverrides, localDeletedAgentIds]);

  const program = useAnchorProgram();

  // Active step in the linear developer flow (Step 1-5)
  const [currentStep, setCurrentStep] = useState(1);

  // Playground simulated agent keypair (stored in localStorage)
  const [simulatedSigner, setSimulatedSigner] = useState<Keypair | null>(null);

  // Form input states
  const [agentIdInput, setAgentIdInput] = useState("1");
  const [maxCallInput, setMaxCallInput] = useState("5.0");
  const [maxMinuteInput, setMaxMinuteInput] = useState("15.0");
  const [allowedProviderInput, setAllowedProviderInput] = useState("");
  const [solSeedInput, setSolSeedInput] = useState("0.05");

  // Interaction inputs
  const [depositAmount, setDepositAmount] = useState("1000.0");
  const [spendAmount, setSpendAmount] = useState("1.5");

  // Multi-LLM solver configurations
  const [llmProvider, setLlmProvider] = useState<LlmProvider>("auto");
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "");
  const [modelName, setModelName] = useState(process.env.NEXT_PUBLIC_MODEL_NAME || "xiaomi/mimo-v2.5");

  // Merchant challenge destination & token mint
  const [merchantWallet, setMerchantWallet] = useState("F5FjAAU6y22eUisRo1dzm5L6ENB4XTNMUGxJrYKsUBvY");
  const [usdcMintInput, setUsdcMintInput] = useState("4zMMC9zXDM2thz7sQZgM7Y6hE784q89S15z3cNMCw5fG");

  // Live Solver execution status states
  const [solverState, setSolverState] = useState<"idle" | "fetching" | "querying" | "signing" | "done" | "error">("idle");
  const [agentSolverStates, setAgentSolverStates] = useState<Record<number, "idle" | "fetching" | "querying" | "signing" | "done" | "error">>({});
  
  const updateSolverState = useCallback((agentId: number, state: "idle" | "fetching" | "querying" | "signing" | "done" | "error") => {
    setSolverState(state);
    setAgentSolverStates(prev => ({ ...prev, [agentId]: state }));
  }, []);

  const [solverErrorMsg, setSolverErrorMsg] = useState("");
  const [confirmedTxSignature, setConfirmedTxSignature] = useState("");

  // Diagnostics and diagnostic lists
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetStatus, setFaucetStatus] = useState<{ text: string; isError: boolean } | null>(null);

  const [activeTab, setActiveTab] = useState<number>(1);
  const [terminalLogs, setTerminalLogs] = useState<LogLine[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: "info",
      message: "Console initialized. Connect wallet in Step 1 to trigger on-chain dispatches.",
    },
  ]);

  const [actionLoading, setActionLoading] = useState(false);

  // Autopilot Demo States
  const [autoRunning, setAutoRunning] = useState(false);
  const [autopilotStepName, setAutopilotStepName] = useState("");
  const [stepPercent, setStepPercent] = useState(0);
  const [simulationMode, setSimulationMode] = useState(true);

  // Revert Error overlay state
  const [errorPopup, setErrorPopup] = useState<{ title: string; message: string; code?: string } | null>(null);

  // Capstone Masterclass: On-Chain Transaction Signature History for Solana Explorer links
  const [txHistory, setTxHistory] = useState<TxHistoryItem[]>([]);

  // Capstone Masterclass: LLM Cognitive Audit & Telemetry parameters per agent ID
  const [cognitiveTelemetry, setCognitiveTelemetry] = useState<Record<number, {
    latency: number;
    promptTokens: number;
    completionTokens: number;
    systemInstruction: string;
    userPrompt: string;
    modelOutput: string;
    modelName: string;
  }>>({});

  // Capstone Masterclass: Decrypted Premium Data Feeds from Server Agent
  const [dataFeeds, setDataFeeds] = useState<DataFeedItem[]>([]);

  // Helper to log tx history entries and store in state
  const recordTxEvent = useCallback((event: Omit<TxHistoryItem, "timestamp">) => {
    const newEvent: TxHistoryItem = { ...event, timestamp: Date.now() };
    setTxHistory(prev => {
      const updated = [newEvent, ...prev].slice(0, 50);
      try {
        localStorage.setItem("solagent_tx_history", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const pickServerLabel = useCallback((provider: Exclude<LlmProvider, "auto">, agentId: number) => {
    const pool = SERVER_POOLS[provider] ?? SERVER_POOLS.mock;
    if (pool.length === 0) return "Unknown Server";
    const offset = Math.floor(Math.random() * pool.length);
    return pool[(agentId + offset) % pool.length];
  }, []);

  // Helper to log decrypted premium data streams from the server agent
  const logDataFeed = useCallback((agentId: number, selectedPayload: string, serverLabel: string, providerLabel: LlmProvider) => {
    const newFeedItem = {
      timestamp: Date.now(),
      agentId,
      feedType: agentId === 1 ? "DeFi Predictions" :
                agentId === 2 ? "Multi-Sig Proof" :
                agentId === 3 ? "Yield Analysis" :
                agentId === 4 ? "Meteo Anomalies" :
                agentId === 5 ? "Order Heatmap" :
                agentId === 6 ? "Cyber Threat Audit" : "Premium Data Feed",
      payload: selectedPayload,
      cost: parseFloat(spendAmount),
      size: selectedPayload.length,
      serverLabel,
      providerLabel,
    };
    setDataFeeds(prev => {
      const updated = [newFeedItem, ...prev].slice(0, 50);
      try {
        localStorage.setItem("solagent_data_feeds", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, [spendAmount]);

  const addLog = useCallback((type: "success" | "error" | "info" | "warning", message: string) => {
    setTerminalLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
      },
    ]);
  }, []);

  const sleep = useCallback((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)), []);
  const isRateLimitErr = useCallback((err: unknown) => {
    const msg = String((err as any)?.message || err || "").toLowerCase();
    return msg.includes("429") || msg.includes("rate limit");
  }, []);

  const getLatestBlockhashWithRetry = useCallback(async () => {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await connection.getLatestBlockhash("confirmed");
      } catch (err) {
        lastErr = err;
        if (!isRateLimitErr(err) || attempt === 3) throw err;
        await sleep(500 * (attempt + 1));
      }
    }
    throw lastErr;
  }, [connection, isRateLimitErr, sleep]);

  const appendSendTxLogs = useCallback(async (err: unknown, tag: string) => {
    if (!(err instanceof SendTransactionError)) return;
    try {
      const logs = await err.getLogs(connection);
      if (logs && logs.length > 0) {
        addLog("error", `🧾 ${tag} logs: ${logs.slice(0, 3).join(" | ")}`);
      }
    } catch {
      // Ignore log retrieval failures and keep original error path.
    }
  }, [connection, addLog]);

  // Automatically fetch connected wallet SOL balance
  const fetchSolBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const bal = await connection.getBalance(publicKey);
      setSolBalance(bal / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error("Failed to query SOL balance", err);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchSolBalance();
      const interval = setInterval(fetchSolBalance, 8000);
      return () => clearInterval(interval);
    } else {
      setSolBalance(null);
    }
  }, [connected, publicKey, fetchSolBalance]);

  // Request 1.0 SOL Devnet Airdrop
  const claimAirdrop = async () => {
    if (!publicKey) return;
    setFaucetLoading(true);
    setFaucetStatus({ text: "Requesting 1.0 SOL on-chain from airdrop faucet...", isError: false });
    addLog("info", "Requesting Devnet SOL airdrop...");

    try {
      const sig = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
      const latestBlockHash = await getLatestBlockhashWithRetry();
      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        },
        "confirmed"
      );

      setFaucetStatus({ text: "Airdrop claimed successfully! 🎉 SOL balance updated.", isError: false });
      addLog("success", "SOL airdrop transaction confirmed on-chain! 🪂");
      await fetchSolBalance();
    } catch (err: any) {
      console.error(err);
      setFaucetStatus({ text: "Faucet request limited or busy. Try again soon!", isError: true });
      addLog("warning", "SOL Faucet is busy. Claim again or use Surfnet/localnet validator.");
    } finally {
      setFaucetLoading(false);
    }
  };

  // Auto-increment agent ID based on existing registered agents
  useEffect(() => {
    if (agents && agents.length > 0) {
      const maxId = Math.max(...agents.map((a) => a.id), 0);
      setAgentIdInput((maxId + 1).toString());
      const active = agents.find((a) => a.id === activeTab);
      if (!active) {
        setActiveTab(agents[0].id);
      }
    } else {
      setAgentIdInput("1");
    }
  }, [agents, activeTab]);

  // Load custom credentials & simulated hotkeys from localStorage on mount
  useEffect(() => {
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

      // Load saved credentials
      const savedProvider = localStorage.getItem("solagent_llm_provider");
      if (savedProvider && ["gemini", "openrouter", "ollama", "mock", "auto"].includes(savedProvider)) {
        setLlmProvider(savedProvider as LlmProvider);
      }

      const savedApiKey = localStorage.getItem("solagent_api_key");
      if (savedApiKey) setApiKey(savedApiKey);

      const savedModel = localStorage.getItem("solagent_model_name");
      if (savedModel) setModelName(savedModel);

      const savedMerchant = localStorage.getItem("solagent_merchant_wallet");
      if (savedMerchant) setMerchantWallet(savedMerchant);

      const savedMint = localStorage.getItem("solagent_usdc_mint");
      if (savedMint) setUsdcMintInput(savedMint);

      const savedSimulationMode = localStorage.getItem("solagent_simulation_mode");
      if (savedSimulationMode !== null) {
        setSimulationMode(savedSimulationMode === "true");
      }

      const savedHistory = localStorage.getItem("solagent_tx_history");
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          const normalized: TxHistoryItem[] = Array.isArray(parsed)
            ? parsed.map((item: any) => ({
                type: item.type || "Unknown",
                id: item.id,
                signature: item.signature,
                timestamp: item.timestamp || Date.now(),
                serverLabel: item.serverLabel,
                mode: item.mode || (item.signature ? "real" : "sim"),
                status: item.status || (item.signature ? "confirmed" : "simulated"),
                balanceBefore: item.balanceBefore,
                balanceAfter: item.balanceAfter,
                delta: item.delta,
                message: item.message,
              }))
            : [];
          setTxHistory(normalized);
        } catch (e) {}
      }

      const savedFeeds = localStorage.getItem("solagent_data_feeds");
      if (savedFeeds) {
        try {
          const parsed = JSON.parse(savedFeeds);
          if (Array.isArray(parsed)) {
            const normalized = parsed.map((feed: any) => ({
              timestamp: feed.timestamp || Date.now(),
              agentId: feed.agentId || 0,
              feedType: feed.feedType || "Premium Data Feed",
              payload: feed.payload || "",
              cost: typeof feed.cost === "number" ? feed.cost : 0,
              size: typeof feed.size === "number" ? feed.size : String(feed.payload || "").length,
              serverLabel: feed.serverLabel || "Unknown Server",
              providerLabel: feed.providerLabel || "mock",
            }));
            setDataFeeds(normalized);
          }
        } catch (e) {}
      }

      const savedTelemetry = localStorage.getItem("solagent_cognitive_telemetry");
      if (savedTelemetry) {
        try {
          setCognitiveTelemetry(JSON.parse(savedTelemetry));
        } catch (e) {}
      }
    }
  }, []);

  // Auto-persist telemetry to localStorage
  useEffect(() => {
    if (Object.keys(cognitiveTelemetry).length > 0) {
      localStorage.setItem("solagent_cognitive_telemetry", JSON.stringify(cognitiveTelemetry));
    }
  }, [cognitiveTelemetry]);

  useEffect(() => {
    localStorage.setItem("solagent_llm_provider", llmProvider);
  }, [llmProvider]);

  useEffect(() => {
    localStorage.setItem("solagent_simulation_mode", String(simulationMode));
  }, [simulationMode]);

  // Determine active step based on progress to guide the user sequentially
  useEffect(() => {
    if (!connected) {
      setCurrentStep(1);
    } else if (vaultInitialized === false || agents.length === 0) {
      setCurrentStep(2);
    } else if (agents.length > 0 && agents.find((a) => a.id === activeTab)?.balance === 0) {
      setCurrentStep(3);
    } else if (agents.length > 0) {
      setCurrentStep(4);
    }
  }, [connected, vaultInitialized, agents, activeTab]);

  const triggerErrorPopup = useCallback((title: string, err: any) => {
    let msg = typeof err === "string" ? err : err.message || err.toString();
    if (msg.includes("rejected") || msg.includes("User rejected")) {
      addLog("warning", "❌ Signature cancelled: You rejected the request in your wallet.");
      return;
    }
    let code = "On-Chain Revert";

    if (msg.includes("6000") || msg.includes("0x1770") || msg.includes("Overflow")) {
      msg = "Calculation overflowed inside the smart contract arithmetic checks.";
      code = "6000 (Overflow)";
    } else if (msg.includes("6001") || msg.includes("0x1771") || msg.includes("PAUSED")) {
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
    } else if (msg.includes("IncorrectProgramId") || msg.includes("incorrect program id for instruction")) {
      msg = "Token program mismatch detected. This app currently supports classic SPL Token mints (Tokenkeg...) only. Use the default devnet USDC mint or the custom mint created in Step 3.";
      code = "TokenProgramMismatch";
    }

    setErrorPopup({ title, message: msg, code });
  }, []);

  const getVaultPda = useCallback((owner: PublicKey) => {
    return PublicKey.findProgramAddressSync([Buffer.from("vault"), owner.toBuffer()], program.programId)[0];
  }, [program]);

  const getAgentPda = useCallback((vault: PublicKey, id: number) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), vault.toBuffer(), new anchor.BN(id).toArrayLike(Buffer, "le", 8)],
      program.programId
    )[0];
  }, [program]);

  const getAgentKeypair = useCallback((id: number | string): Keypair => {
    const numericId = typeof id === "number" ? id : parseInt(id as string, 10);
    if (isNaN(numericId)) return Keypair.generate();

    // 1. Try to find the on-chain agent's registered signer public key
    const onChainAgent = agents.find((a) => a.id === numericId);
    const registeredSignerPubkey = onChainAgent?.signer;

    if (typeof window !== "undefined") {
      // 2. Load the agent-specific key from localStorage if it exists
      const storedAgentKey = localStorage.getItem(`solagent_agent_key_${numericId}`);
      if (storedAgentKey) {
        try {
          const arr = JSON.parse(storedAgentKey);
          const kp = Keypair.fromSecretKey(new Uint8Array(arr));
          // If there is a registered signer on-chain and it matches, or if there is no registered signer on-chain yet (creating it)
          if (!registeredSignerPubkey || kp.publicKey.toBase58() === registeredSignerPubkey) {
            return kp;
          }
        } catch (e) {
          // ignore
        }
      }

      // 3. Fallback to the global simulated signer key if it matches the on-chain registered signer
      const storedSimulatedKey = localStorage.getItem("solagent_simulated_key");
      if (storedSimulatedKey) {
        try {
          const arr = JSON.parse(storedSimulatedKey);
          const kp = Keypair.fromSecretKey(new Uint8Array(arr));
          if (registeredSignerPubkey && kp.publicKey.toBase58() === registeredSignerPubkey) {
            // Also store it as the agent-specific key so we don't need to fall back next time
            localStorage.setItem(`solagent_agent_key_${numericId}`, JSON.stringify(Array.from(kp.secretKey)));
            return kp;
          }
        } catch (e) {
          // ignore
        }
      }

      // 4. If there's an on-chain agent but we don't have its private key, but we do have simulatedSigner in memory
      if (registeredSignerPubkey && simulatedSigner && simulatedSigner.publicKey.toBase58() === registeredSignerPubkey) {
        localStorage.setItem(`solagent_agent_key_${numericId}`, JSON.stringify(Array.from(simulatedSigner.secretKey)));
        return simulatedSigner;
      }
    }

    // 5. Fallback or new generation
    if (typeof window !== "undefined") {
      const storedAgentKey = localStorage.getItem(`solagent_agent_key_${numericId}`);
      if (storedAgentKey) {
        try {
          const arr = JSON.parse(storedAgentKey);
          return Keypair.fromSecretKey(new Uint8Array(arr));
        } catch (e) {
          // ignore
        }
      }
    }

    const kp = Keypair.generate();
    if (typeof window !== "undefined") {
      localStorage.setItem(`solagent_agent_key_${numericId}`, JSON.stringify(Array.from(kp.secretKey)));
    }
    return kp;
  }, [agents, simulatedSigner]);


  const resolveSupportedMint = useCallback(async () => {
    const mintKey = new PublicKey(usdcMintInput.trim());
    const mintInfo = await connection.getAccountInfo(mintKey);

    if (!mintInfo) {
      throw new Error("Configured mint does not exist on this cluster.");
    }

    if (!mintInfo.owner.equals(TOKEN_PROGRAM_ID)) {
      throw new Error(
        `Unsupported token program for mint ${mintKey.toBase58()}. Expected ${TOKEN_PROGRAM_ID.toBase58()} but got ${mintInfo.owner.toBase58()}.`
      );
    }

    return mintKey;
  }, [connection, usdcMintInput]);

  // Step 2: Initialize Registry
  const handleInitVault = async () => {
    setActionLoading(true);
    addLog("info", "Sending initialize_vault transaction on-chain...");
    try {
      await initializeVault();
      addLog("success", "Global Program Registry PDA initialized successfully on-chain! 🎉");
    } catch (err: any) {
      addLog("error", `Registry deployment failed: ${err.message || err}`);
      triggerErrorPopup("Vault Initialization Failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Spawn Agent PDA
  const handleCreateAgent = async () => {
    if (!publicKey || !simulatedSigner) return;
    setActionLoading(true);
    const id = parseInt(agentIdInput);

    addLog("info", `Registering Agent #${id} with custom rate-limits on-chain...`);

    try {
      const vaultPda = getVaultPda(publicKey);
      const agentPda = getAgentPda(vaultPda, id);
      const existingAgentInfo = await connection.getAccountInfo(agentPda);
      if (existingAgentInfo) {
        let suggestedId = id + 1;
        for (let candidate = id + 1; candidate <= id + 50; candidate++) {
          const candidatePda = getAgentPda(vaultPda, candidate);
          const candidateInfo = await connection.getAccountInfo(candidatePda);
          if (!candidateInfo) {
            suggestedId = candidate;
            break;
          }
        }
        setAgentIdInput(String(suggestedId));
        const errorMsg = `Agent #${id} PDA already exists on-chain. Switched input to #${suggestedId}.`;
        addLog("error", `[BLOCKED] Agent #${id} already exists. Try Agent #${suggestedId}.`);
        triggerErrorPopup("Agent ID Already Exists", errorMsg);
        return;
      }

      const maxCallLamports = new anchor.BN(parseFloat(maxCallInput) * 1_000_000);
      const maxMinuteLamports = new anchor.BN(parseFloat(maxMinuteInput) * 1_000_000);
      const solAllocationLamports = new anchor.BN(parseFloat(solSeedInput) * LAMPORTS_PER_SOL);

      const allowedArr: PublicKey[] = Array(5).fill(PublicKey.default);
      if (allowedProviderInput) {
        try {
          allowedArr[0] = new PublicKey(allowedProviderInput.trim());
        } catch (e) {
          addLog("warning", "Invalid allowlist address format. Defaulting to open policies.");
        }
      }

      const agentKeypair = getAgentKeypair(id);
      const signature = await program.methods
        .createAgent(new anchor.BN(id), maxCallLamports, maxMinuteLamports, allowedArr as any, solAllocationLamports)
        .accounts({
          vaultState: vaultPda,
          agentState: agentPda,
          agentSigner: agentKeypair.publicKey,
          owner: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      recordTxEvent({
        type: "Spawn Agent",
        id,
        signature,
        mode: "real",
        status: "confirmed",
      });
      
      const activeNetwork = typeof window !== "undefined" ? localStorage.getItem("solagent_network") : "devnet";
      const clusterParam = activeNetwork === "localnet"
        ? "cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899"
        : "cluster=devnet";
      const explorerUrl = `https://orbmarkets.io/tx/${signature}?${clusterParam}`;
      addLog("info", `🔍 Spawn Tx Signature: ${signature}`);
      addLog("success", `🔗 Spawn Explorer Link: ${explorerUrl}`);
      
      addLog("success", `Agent #${id} PDA successfully spawned on-chain! Spends delegated to hotkey. ✅`);
      
      // Update local overrides instantly
      setLocalDeletedAgentIds(prev => prev.filter(x => x !== id));
      setLocalAgentOverrides(prev => ({
        ...prev,
        [id]: {
          id,
          publicKey: agentPda.toBase58(),
          signer: agentKeypair.publicKey.toBase58(),
          balance: 0,
          maxPerCall: parseFloat(maxCallInput),
          maxPerMinute: parseFloat(maxMinuteInput),
          status: "Active",
          allowedProviders: allowedProviderInput ? [allowedProviderInput.trim()] : [],
        }
      }));

      setActiveTab(id);
      await reload(); // Force-refresh agent list so it shows up in the frontend instantly!

      // Demo-speed onboarding: auto-fund every freshly spawned agent.
      addLog("info", `Auto-funding Agent #${id} with ${AUTO_FUND_NEW_AGENT_TOKENS} tokens for immediate run readiness...`);
      try {
        let mintExists = false;
        try {
          const mintKey = new PublicKey(usdcMintInput.trim());
          const mintInfo = await connection.getAccountInfo(mintKey);
          if (mintInfo && mintInfo.owner.equals(TOKEN_PROGRAM_ID)) {
            mintExists = true;
          }
        } catch (e) {
          mintExists = false;
        }

        if (!mintExists) {
          await deployCustomMint();
        }

        await handleDeposit(id, AUTO_FUND_NEW_AGENT_TOKENS);
      } catch (fundErr: any) {
        if (isRateLimitErr(fundErr)) {
          addLog("warning", `RPC rate-limited while auto-funding Agent #${id}. Retrying once in 2s...`);
          await sleep(2000);
          try {
            await handleDeposit(id, AUTO_FUND_NEW_AGENT_TOKENS);
            return;
          } catch (retryErr: any) {
            addLog("warning", `Agent #${id} created, auto-fund retry failed: ${retryErr?.message || retryErr}`);
            return;
          }
        }
        addLog("warning", `Agent #${id} created, but auto-fund failed: ${fundErr?.message || fundErr}`);
      }
    } catch (err: any) {
      console.error(err);
      addLog("error", `Agent registration failed: ${err.message || err}`);
      triggerErrorPopup("Agent Spawn Failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to deploy custom mint
  const deployCustomMint = async (): Promise<PublicKey> => {
    addLog("info", "🛠️ Custom orbmarkets.io token mint not found on-chain. Deploying custom mint first...");
    const mintKeypair = Keypair.generate();
    const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

    const ownerTokenAccount = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      publicKey!,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction();
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: publicKey!,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: rentExemptBalance,
        programId: TOKEN_PROGRAM_ID,
      })
    );

    transaction.add(
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        6, // decimals
        publicKey!, // mintAuthority
        publicKey! // freezeAuthority
      )
    );

    transaction.add(
      createAssociatedTokenAccountInstruction(
        publicKey!,
        ownerTokenAccount,
        publicKey!,
        mintKeypair.publicKey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    transaction.add(
      createMintToInstruction(mintKeypair.publicKey, ownerTokenAccount, publicKey!, 1_000_000_000_000) // 1,000,000 tokens
    );

    const latestBlockhash = await getLatestBlockhashWithRetry();
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = publicKey!;

    // Partially sign the transaction with the mint keypair
    transaction.partialSign(mintKeypair);

    let signature: string;
    if (wallet.signTransaction) {
      addLog("info", "🔑 Please sign the token minting transaction in your wallet standard modal...");
      const signedTx = await wallet.signTransaction(transaction);
      addLog("info", "⚙️ Submitting raw transaction with mint keypair signature...");
      signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
    } else {
      addLog("info", "🔑 Please sign the token minting transaction in your wallet standard modal...");
      signature = await wallet.sendTransaction(transaction, connection, {
        signers: [mintKeypair],
      });
    }

    addLog("info", "⚙️ Confirming block transactions...");
    await connection.confirmTransaction(signature, "confirmed");

    recordTxEvent({
      type: "Create Mint",
      signature,
      mode: "real",
      status: "confirmed",
    });
    addLog("success", `🎉 Custom orbmarkets.io Token Mint successfully deployed! Address: ${mintKeypair.publicKey.toBase58()}`);
    setUsdcMintInput(mintKeypair.publicKey.toBase58());
    localStorage.setItem("solagent_usdc_mint", mintKeypair.publicKey.toBase58());

    return mintKeypair.publicKey;
  };

  // Step 3: Deploy Custom Token Mint
  const handleCreateCustomMint = async () => {
    if (!publicKey) return;
    setActionLoading(true);
    try {
      await deployCustomMint();
    } catch (err: any) {
      console.error(err);
      addLog("error", `Token mint deployment failed: ${err.message || err}`);
      triggerErrorPopup("Custom Mint Deploy Failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3: Deposit custom tokens into vault
  const handleDeposit = async (customId?: number, customAmount?: string) => {
    if (!publicKey) return;
    setActionLoading(true);

    const id = customId !== undefined ? customId : activeTab;
    const amountVal = customAmount !== undefined ? customAmount : depositAmount;

    addLog("info", `Initiating deposit of $${amountVal} orbmarkets.io into Agent #${id} Vault...`);

    try {
      const vaultPda = getVaultPda(publicKey);
      const agentPda = getAgentPda(vaultPda, id);
      const usdcMintKey = await resolveSupportedMint();

      const agentTokenAccount = getAssociatedTokenAddressSync(
        usdcMintKey,
        agentPda,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const ownerTokenAccount = getAssociatedTokenAddressSync(
        usdcMintKey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Dynamic Check: Ensure Owner's Wallet custom token account is initialized and has sufficient balance
      const ownerAtaInfo = await connection.getAccountInfo(ownerTokenAccount);
      const depositVal = new anchor.BN(parseFloat(amountVal) * 1_000_000);
      const depositValBigInt = BigInt(depositVal.toString());

      let needsInit = !ownerAtaInfo;
      let needsMint = false;

      if (needsInit) {
        needsMint = true;
      } else {
        try {
          const tokenBalance = await connection.getTokenAccountBalance(ownerTokenAccount);
          const currentBalance = BigInt(tokenBalance.value.amount);
          if (currentBalance < depositValBigInt) {
            needsMint = true;
          }
        } catch (e) {
          needsMint = true;
        }
      }

      let isAuthority = false;
      try {
        const mintInfoDetails = await getMint(connection, usdcMintKey);
        isAuthority = mintInfoDetails.mintAuthority?.equals(publicKey) || false;
      } catch (e) {
        // Assume not the authority if we cannot fetch details (e.g. rate limit / network error)
      }

      if (needsInit || (needsMint && isAuthority)) {
        const tx = new Transaction();
        if (needsInit) {
          addLog("info", "🛠️ Your Wallet Token Account is not initialized. Spawning ATA on-chain...");
          tx.add(
            createAssociatedTokenAccountInstruction(
              publicKey, // payer
              ownerTokenAccount, // associatedTokenAddress
              publicKey, // walletAddress
              usdcMintKey, // mint
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }

        if (needsMint && isAuthority) {
          const mintAmt = depositValBigInt > BigInt("1000000000000") ? depositValBigInt * BigInt(2) : BigInt("1000000000000");
          addLog("info", `🛠️ Minting additional custom tokens to your wallet (${Number(mintAmt) / 1_000_000} orbmarkets.io)...`);
          tx.add(
            createMintToInstruction(
              usdcMintKey,
              ownerTokenAccount,
              publicKey, // mintAuthority
              Number(mintAmt)
            )
          );
        }

        const latest = await getLatestBlockhashWithRetry();
        tx.recentBlockhash = latest.blockhash;
        tx.feePayer = publicKey;

        addLog("info", "🔑 Sign transaction in your wallet to initialize/fund custom tokens...");
        const signature = await wallet.sendTransaction(tx, connection);
        addLog("info", "⚙️ Confirming custom token funding...");
        await connection.confirmTransaction(signature, "confirmed");
        recordTxEvent({
          type: "Setup Wallet ATA",
          signature,
          mode: "real",
          status: "confirmed",
        });
        addLog("success", "✅ Wallet Associated Token Account successfully setup!");
      } else if (needsMint && !isAuthority) {
        addLog("warning", "⚠️ Wallet is not the mint authority. Skipping faucet auto-minting (ensure your wallet holds pre-existing tokens).");
      }

      addLog("info", "🔑 Confirm the deposit instruction in your wallet modal...");

      const signature = await program.methods
        .deposit(depositVal, new anchor.BN(id))
        .accounts({
          vaultState: vaultPda,
          agentState: agentPda,
          owner: publicKey,
          ownerTokenAccount: ownerTokenAccount,
          agentTokenAccount: agentTokenAccount,
          usdcMint: usdcMintKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const beforeBalance = agents.find((agent) => agent.id === id)?.balance ?? 0;
      const delta = parseFloat(amountVal);
      recordTxEvent({
        type: "Deposit Agent Vault",
        id,
        signature,
        mode: "real",
        status: "confirmed",
        balanceBefore: beforeBalance,
        balanceAfter: beforeBalance + delta,
        delta,
      });
      
      const activeNetwork = typeof window !== "undefined" ? localStorage.getItem("solagent_network") : "devnet";
      const clusterParam = activeNetwork === "localnet"
        ? "cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899"
        : "cluster=devnet";
      const explorerUrl = `https://orbmarkets.io/tx/${signature}?${clusterParam}`;
      addLog("info", `🔍 Deposit Tx Signature: ${signature}`);
      addLog("success", `🔗 Deposit Explorer Link: ${explorerUrl}`);

      addLog("info", "⚙️ Awaiting Devnet block verification...");
      addLog("success", `Deposited $${amountVal} orbmarkets.io into Agent #${id} Vault on-chain! 🎉`);
      
      // Update local overrides instantly
      setLocalAgentOverrides(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          balance: beforeBalance + delta
        }
      }));

      await reload();
    } catch (err: any) {
      const errMsg = err?.message || err?.toString() || "";
      if (errMsg.includes("rejected") || errMsg.includes("User rejected")) {
        addLog("warning", "❌ Signature cancelled: You rejected the request in your wallet.");
        recordTxEvent({
          type: "Deposit Agent Vault",
          id,
          mode: simulationMode ? "sim" : "real",
          status: "failed",
          message: errMsg,
        });
        return;
      }

      if (!simulationMode) {
        addLog("error", `❌ Real mode: deposit failed on-chain (${errMsg}).`);
        recordTxEvent({
          type: "Deposit Agent Vault",
          id,
          mode: "real",
          status: "failed",
          message: errMsg,
        });
        triggerErrorPopup("Deposit Failed (Real Mode)", err);
        return;
      }

      console.warn("On-chain token deposit rejected, falling back to simulated confirmation...", err);
      addLog("warning", "⚠️ Simulation Mode: on-chain deposit failed, recording simulated confirmation.");
      setTimeout(async () => {
        const beforeBalance = agents.find((agent) => agent.id === id)?.balance ?? 0;
        const delta = parseFloat(amountVal);
        recordTxEvent({
          type: "Deposit Agent Vault",
          id,
          mode: "sim",
          status: "simulated",
          balanceBefore: beforeBalance,
          balanceAfter: beforeBalance + delta,
          delta,
          message: errMsg,
        });
        addLog("success", `Successfully simulated deposit of $${amountVal} USDC into Agent #${id} Vault!`);
        
        // Update local overrides instantly
        setLocalAgentOverrides(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            balance: beforeBalance + delta
          }
        }));

        await reload();
      }, 1000);
    } finally {
      setActionLoading(false);
    }
  };

  // Withdraw custom tokens on-chain
  const handleWithdraw = async (id: number, amountStr: string) => {
    if (!publicKey) return;
    setActionLoading(true);
    addLog("info", `Initiating withdrawal of $${amountStr} tokens from Agent #${id} Vault on-chain...`);

    try {
      const vaultPda = getVaultPda(publicKey);
      const agentPda = getAgentPda(vaultPda, id);
      const usdcMintKey = await resolveSupportedMint();

      const agentTokenAccount = getAssociatedTokenAddressSync(
        usdcMintKey,
        agentPda,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const ownerTokenAccount = getAssociatedTokenAddressSync(
        usdcMintKey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const withdrawAmount = new anchor.BN(parseFloat(amountStr) * 1_000_000);

      addLog("info", "🔑 Confirm the withdraw transaction in your wallet modal...");

      const signature = await program.methods
        .withdraw(withdrawAmount, new anchor.BN(id))
        .accounts({
          agentState: agentPda,
          owner: publicKey,
          agentTokenAccount: agentTokenAccount,
          ownerTokenAccount: ownerTokenAccount,
          usdcMint: usdcMintKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      const beforeBalance = agents.find((agent) => agent.id === id)?.balance ?? 0;
      const delta = -parseFloat(amountStr);
      recordTxEvent({
        type: "Withdraw Vault",
        id,
        signature,
        mode: "real",
        status: "confirmed",
        balanceBefore: beforeBalance,
        balanceAfter: Math.max(0, beforeBalance + delta),
        delta,
      });

      const activeNetwork = typeof window !== "undefined" ? localStorage.getItem("solagent_network") : "devnet";
      const clusterParam = activeNetwork === "localnet"
        ? "cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899"
        : "cluster=devnet";
      const explorerUrl = `https://orbmarkets.io/tx/${signature}?${clusterParam}`;
      addLog("info", `🔍 Withdraw Tx Signature: ${signature}`);
      addLog("success", `🔗 Withdraw Explorer Link: ${explorerUrl}`);

      addLog("success", `Withdrew $${amountStr} custom tokens successfully back to your wallet! ✅`);
      
      // Update local overrides instantly
      setLocalAgentOverrides(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          balance: Math.max(0, beforeBalance + delta)
        }
      }));

      await reload();
    } catch (err: any) {
      const errMsg = err?.message || err?.toString() || "";
      if (errMsg.includes("rejected") || errMsg.includes("User rejected")) {
        addLog("warning", "❌ Signature cancelled: You rejected the request in your wallet.");
        recordTxEvent({
          type: "Withdraw Vault",
          id,
          mode: simulationMode ? "sim" : "real",
          status: "failed",
          message: errMsg,
        });
        return;
      }

      if (!simulationMode) {
        addLog("error", `❌ Real mode: withdraw failed on-chain (${errMsg}).`);
        recordTxEvent({
          type: "Withdraw Vault",
          id,
          mode: "real",
          status: "failed",
          message: errMsg,
        });
        triggerErrorPopup("Withdraw Failed (Real Mode)", err);
        return;
      }

      console.warn("On-chain withdraw rejected, simulating drain confirmation...", err);
      addLog("warning", "⚠️ Simulation Mode: on-chain withdraw rejected, simulating account drainage.");
      setTimeout(async () => {
        const beforeBalance = agents.find((agent) => agent.id === id)?.balance ?? 0;
        const delta = -parseFloat(amountStr);
        recordTxEvent({
          type: "Withdraw Vault",
          id,
          mode: "sim",
          status: "simulated",
          balanceBefore: beforeBalance,
          balanceAfter: Math.max(0, beforeBalance + delta),
          delta,
          message: errMsg,
        });
        addLog("success", `Successfully simulated vault drainage of $${amountStr} tokens from Agent #${id}!`);
        
        // Update local overrides instantly
        setLocalAgentOverrides(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            balance: Math.max(0, beforeBalance + delta)
          }
        }));

        await reload();
      }, 1000);
    } finally {
      setActionLoading(false);
    }
  };

  // Close Agent PDA on-chain (reclaims rent SOL)
  const handleCloseAgent = async (id: number) => {
    if (!publicKey) return;
    setActionLoading(true);
    addLog("info", `Initiating on-chain close & de-registration for Agent #${id} PDA...`);

    try {
      const vaultPda = getVaultPda(publicKey);
      const agentPda = getAgentPda(vaultPda, id);
      let usdcMintKey: PublicKey;
      try {
        usdcMintKey = await resolveSupportedMint();
      } catch (mintErr) {
        addLog("warning", "⚠️ Configured custom mint is not deployed or invalid. Falling back to default Devnet USDC mint for de-registration.");
        usdcMintKey = new PublicKey("4zMMC9zXDM2thz7sQZgM7Y6hE784q89S15z3cNMCw5fG");
      }

      const agentTokenAccount = getAssociatedTokenAddressSync(
        usdcMintKey,
        agentPda,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const ownerTokenAccount = getAssociatedTokenAddressSync(
        usdcMintKey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      let needInitAta = false;
      try {
        const info = await connection.getAccountInfo(agentTokenAccount);
        if (!info) {
          needInitAta = true;
        }
      } catch (e) {
        needInitAta = true;
      }

      let needInitOwnerAta = false;
      try {
        const info = await connection.getAccountInfo(ownerTokenAccount);
        if (!info) {
          needInitOwnerAta = true;
        }
      } catch (e) {
        needInitOwnerAta = true;
      }

      const tx = new Transaction();
      if (needInitAta) {
        addLog("info", "🛠️ Agent Associated Token Account is not initialized. Spawning ATA on-chain first...");
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            agentTokenAccount,
            agentPda,
            usdcMintKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      if (needInitOwnerAta) {
        addLog("info", "🛠️ Your Wallet Token Account is not initialized. Spawning owner ATA on-chain first...");
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            ownerTokenAccount,
            publicKey,
            usdcMintKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      const closeIx = await program.methods
        .closeAgent(new anchor.BN(id))
        .accounts({
          vaultState: vaultPda,
          agentState: agentPda,
          owner: publicKey,
          agentTokenAccount: agentTokenAccount,
          ownerTokenAccount: ownerTokenAccount,
          usdcMint: usdcMintKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

      tx.add(closeIx);

      const latestBlockhash = await getLatestBlockhashWithRetry();
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = publicKey;

      addLog("info", "🔑 Confirm the close PDA transaction in your wallet modal...");
      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      const beforeBalance = agents.find((agent) => agent.id === id)?.balance ?? 0;
      recordTxEvent({
        type: "Decommission Agent",
        id,
        signature,
        mode: "real",
        status: "confirmed",
        balanceBefore: beforeBalance,
        balanceAfter: 0,
        delta: -beforeBalance,
      });

      const activeNetwork = typeof window !== "undefined" ? localStorage.getItem("solagent_network") : "devnet";
      const clusterParam = activeNetwork === "localnet"
        ? "cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899"
        : "cluster=devnet";
      const explorerUrl = `https://orbmarkets.io/tx/${signature}?${clusterParam}`;
      addLog("info", `🔍 Close Tx Signature: ${signature}`);
      addLog("success", `🔗 Close Explorer Link: ${explorerUrl}`);

      addLog("success", `Agent #${id} PDA successfully closed! Rent SOL refunded to your wallet. 🗑️`);
      
      // Update local overrides instantly
      setLocalDeletedAgentIds(prev => [...prev, id]);
      setLocalAgentOverrides(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      await reload();
    } catch (err: any) {
      const errMsg = err?.message || err?.toString() || "";
      if (!simulationMode) {
        addLog("error", `❌ Real mode: close agent failed on-chain (${errMsg}).`);
        recordTxEvent({
          type: "Decommission Agent",
          id,
          mode: "real",
          status: "failed",
          message: errMsg,
        });
        triggerErrorPopup("Close Agent Failed (Real Mode)", err);
        return;
      }

      console.warn("On-chain close rejected, simulating account de-registration...", err);
      addLog("warning", "⚠️ Simulation Mode: on-chain close rejected, simulating de-registration.");
      setTimeout(async () => {
        const beforeBalance = agents.find((agent) => agent.id === id)?.balance ?? 0;
        recordTxEvent({
          type: "Decommission Agent",
          id,
          mode: "sim",
          status: "simulated",
          balanceBefore: beforeBalance,
          balanceAfter: 0,
          delta: -beforeBalance,
          message: errMsg,
        });
        addLog("success", `Successfully de-registered and closed Agent #${id} PDA state account!`);
        
        // Update local overrides instantly
        setLocalDeletedAgentIds(prev => [...prev, id]);
        setLocalAgentOverrides(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });

        await reload();
      }, 1000);
    } finally {
      setActionLoading(false);
    }
  };

  // Decommission/Close all agents in one go (Burn All)
  const handleCloseAllAgents = async () => {
    if (!publicKey) return;
    if (agents.length === 0) {
      addLog("warning", "No active agents found to delete.");
      return;
    }

    setActionLoading(true);
    addLog("info", `Deleting all ${agents.length} agents...`);

    try {
      const vaultPda = getVaultPda(publicKey);
      const usdcMintKey = await resolveSupportedMint();
      const ownerTokenAccount = getAssociatedTokenAddressSync(
        usdcMintKey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      let needInitOwnerAta = false;
      try {
        const info = await connection.getAccountInfo(ownerTokenAccount);
        if (!info) {
          needInitOwnerAta = true;
        }
      } catch (e) {
        needInitOwnerAta = true;
      }

      // Solana transaction size limits prevent deleting hundreds of PDAs in one tx.
      // We batch instructions so wallet can sign all txs in one approval flow where supported.
      const CLOSE_ALL_INSTRUCTIONS_PER_TX = 4;
      const instructionGroups: Array<Array<{ agent: OnChainAgent; ix: anchor.web3.TransactionInstruction }>> = [];
      let currentGroup: Array<{ agent: OnChainAgent; ix: anchor.web3.TransactionInstruction }> = [];

      if (needInitOwnerAta && agents.length > 0) {
        const createOwnerAtaIx = createAssociatedTokenAccountInstruction(
          publicKey,
          ownerTokenAccount,
          publicKey,
          usdcMintKey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        currentGroup.push({ agent: agents[0], ix: createOwnerAtaIx });
      }

      for (const agent of agents) {
        const agentPda = getAgentPda(vaultPda, agent.id);
        const agentTokenAccount = getAssociatedTokenAddressSync(
          usdcMintKey,
          agentPda,
          true,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        let needInitAta = false;
        try {
          const info = await connection.getAccountInfo(agentTokenAccount);
          if (!info) {
            needInitAta = true;
          }
        } catch (e) {
          needInitAta = true;
        }

        if (needInitAta) {
          const createAtaIx = createAssociatedTokenAccountInstruction(
            publicKey,
            agentTokenAccount,
            agentPda,
            usdcMintKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );
          currentGroup.push({ agent, ix: createAtaIx });
        }

        const ix = await program.methods
          .closeAgent(new anchor.BN(agent.id))
          .accounts({
            vaultState: vaultPda,
            agentState: agentPda,
            owner: publicKey,
            agentTokenAccount,
            ownerTokenAccount,
            usdcMint: usdcMintKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .instruction();

        currentGroup.push({ agent, ix });
        if (currentGroup.length >= CLOSE_ALL_INSTRUCTIONS_PER_TX) {
          instructionGroups.push(currentGroup);
          currentGroup = [];
        }
      }
      if (currentGroup.length > 0) {
        instructionGroups.push(currentGroup);
      }

      const latestBlockhash = await getLatestBlockhashWithRetry();
      const transactions = instructionGroups.map((group) => {
        const tx = new Transaction();
        group.forEach((entry) => tx.add(entry.ix));
        tx.feePayer = publicKey;
        tx.recentBlockhash = latestBlockhash.blockhash;
        return tx;
      });

      const signedTxs =
        wallet.signAllTransactions && transactions.length > 1
          ? await (async () => {
              addLog("info", `🔐 Requesting batched wallet signature for ${transactions.length} close transactions...`);
              return wallet.signAllTransactions!(transactions);
            })()
          : null;

      for (let i = 0; i < transactions.length; i++) {
        const group = instructionGroups[i];
        const tx = transactions[i];
        try {
          const signature = signedTxs
            ? await connection.sendRawTransaction(signedTxs[i].serialize(), { skipPreflight: false, preflightCommitment: "confirmed" })
            : await wallet.sendTransaction(tx, connection, { skipPreflight: false, preflightCommitment: "confirmed" });

          await connection.confirmTransaction(
            {
              signature,
              blockhash: latestBlockhash.blockhash,
              lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            },
            "confirmed"
          );

          for (const { agent } of group) {
            recordTxEvent({
              type: "Decommission Agent",
              id: agent.id,
              signature,
              mode: "real",
              status: "confirmed",
              balanceBefore: agent.balance,
              balanceAfter: 0,
              delta: -agent.balance,
            });
          }
          addLog("success", `Batch ${i + 1}/${transactions.length} confirmed. Removed ${group.length} agents.`);
          
          const deletedIds = group.map((entry) => entry.agent.id);
          setLocalDeletedAgentIds((prev) => [...prev, ...deletedIds]);
          setLocalAgentOverrides((prev) => {
            const copy = { ...prev };
            deletedIds.forEach((id) => delete copy[id]);
            return copy;
          });
        } catch (err: any) {
          await appendSendTxLogs(err, `Close-all batch ${i + 1}`);
          const errMsg = err?.message || err?.toString() || "";
          if (!simulationMode) {
            for (const { agent } of group) {
              recordTxEvent({
                type: "Decommission Agent",
                id: agent.id,
                mode: "real",
                status: "failed",
                message: errMsg,
              });
            }
            throw err;
          }

          for (const { agent } of group) {
            recordTxEvent({
              type: "Decommission Agent",
              id: agent.id,
              mode: "sim",
              status: "simulated",
              balanceBefore: agent.balance,
              balanceAfter: 0,
              delta: -agent.balance,
              message: errMsg,
            });
          }
          addLog("warning", `⚠️ Batch ${i + 1}/${transactions.length} failed on-chain. Simulated removals for ${group.length} agents.`);
          
          const deletedIds = group.map((entry) => entry.agent.id);
          setLocalDeletedAgentIds((prev) => [...prev, ...deletedIds]);
          setLocalAgentOverrides((prev) => {
            const copy = { ...prev };
            deletedIds.forEach((id) => delete copy[id]);
            return copy;
          });
        }
      }

      addLog("success", "🎉 All agents successfully deleted! Rent funds returned.");
      await reload();
    } catch (err: any) {
      console.error(err);
      addLog("error", `Batch deletion failed: ${err.message || err}`);
      if (!simulationMode) {
        triggerErrorPopup("Batch Close Failed (Real Mode)", err);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Step 5: Toggle pause status
  const handleTogglePause = async (agent: OnChainAgent) => {
    if (!publicKey) return;
    setActionLoading(true);
    const nextStatus = agent.status === "Active" ? { paused: {} } : { active: {} };
    addLog("info", `Updating status limit config for Agent #${agent.id}...`);

    try {
      const vaultPda = getVaultPda(publicKey);
      const agentPda = getAgentPda(vaultPda, agent.id);

      await program.methods.setConfig(nextStatus as any, null, null, null).accounts({
        agentState: agentPda,
        owner: publicKey,
      }).rpc();

      addLog("warning", `Agent #${agent.id} config updated on-chain to ${agent.status === "Active" ? "PAUSED" : "ACTIVE"}.`);
      await reload();
    } catch (err: any) {
      addLog("error", `Config toggle failed: ${err.message || err}`);
      triggerErrorPopup("Override Toggle Failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 5: Spend triggers & Exploit Simulation Reverts
  const handleSpend = async (mode: "normal" | "exploit-cap" | "exploit-rate" | "exploit-allowlist") => {
    if (!publicKey || !simulatedSigner) return;

    const activeAgent = agents.find((a) => a.id === activeTab);
    if (!activeAgent) {
      addLog("error", "Deploy active Agent PDA on-chain first!");
      return;
    }

    setActionLoading(true);
    let amount = parseFloat(spendAmount);
    let recipient = "Authorized Merchant (Billing)";

    if (mode === "exploit-cap") {
      amount = activeAgent.maxPerCall + 10.0;
      recipient = "Hostile Target (Bypassing call cap)";
      addLog("warning", `Exploit triggered: AI script requesting transaction size of $${amount.toFixed(2)} USDC...`);
    } else if (mode === "exploit-rate") {
      amount = activeAgent.maxPerCall;
      addLog("warning", `Spam exploit triggered: Hammering spend rate limits sequentially on-chain...`);
    } else if (mode === "exploit-allowlist") {
      amount = 1.0;
      recipient = "Non-Allowlisted Malicious Wallet Address";
      addLog("warning", `Direct exploit triggered: Paying to unapproved address target...`);
    } else {
      addLog("info", `Executing verified spend payout of $${amount.toFixed(2)} USDC to ${recipient}...`);
    }

    setTimeout(() => {
      if (activeAgent.status === "Paused") {
        addLog("error", "🛑 [ON-CHAIN REVERT] Transaction Blocked! ErrorCode: 6001 (AgentPaused)");
        triggerErrorPopup("Policy Revert", new Error("AgentStatus is PAUSED (ErrorCode: 6001)"));
      } else if (mode === "exploit-cap") {
        addLog("error", `🛑 [ON-CHAIN REVERT] Blocked! Exceeds Call Cap of $${activeAgent.maxPerCall.toFixed(2)} (ErrorCode: 6003)`);
        triggerErrorPopup("Policy Revert", new Error("ExceedsMaxPerCall (ErrorCode: 6003)"));
      } else if (mode === "exploit-allowlist" && activeAgent.allowedProviders.length > 0) {
        addLog("error", "🛑 [ON-CHAIN REVERT] Blocked! Recipient wallet not on verified allowlist (ErrorCode: 6002)");
        triggerErrorPopup("Policy Revert", new Error("ProviderNotAllowed (ErrorCode: 6002)"));
      } else if (mode === "exploit-rate") {
        addLog("success", `Tx #1: Spent $${amount.toFixed(2)} USDC successfully. ✅`);
        addLog("success", `Tx #2: Spent $${amount.toFixed(2)} USDC successfully. ✅`);
        addLog("error", `🛑 [ON-CHAIN REVERT] Tx #3 Blocked! Exceeds minute rate budget of $${activeAgent.maxPerMinute.toFixed(2)} (ErrorCode: 6004)`);
        triggerErrorPopup("Policy Revert", new Error("ExceedsRateLimit (ErrorCode: 6004)"));
      } else {
        const dummySig = Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        addLog("success", `Transaction Confirmed! Spent $${amount.toFixed(2)} USDC successfully. ✅`);
        addLog("info", `Tx Signature: ${dummySig.substring(0, 16)}...`);
      }
      setActionLoading(false);
    }, 1000);
  };

  // Helper to generate dynamic, highly meaningful JSON data from the Central Server Agent backend
  const generatePremiumJSON = useCallback((agentId: number) => {
    const nowUnix = Math.floor(Date.now() / 1000);
    // Dynamic modulo mapping or randomization based on agentId to ensure dynamic and diverse crypto feeds
    const pool = [
      // 1. Defi predictions
      () => {
        const targetPrice = (180 + Math.random() * 30).toFixed(2);
        return {
          endpoint: "/api/v1/defi/predictions",
          timestamp: nowUnix,
          asset: "SOL/USDC",
          sentiment: "BULLISH",
          analysis: {
            growth_rate_mom: "14.2%",
            target_price_range: `$184.50 - $${targetPrice}`,
            confidence_score: "94.8%"
          },
          decrypted_by_pda: true
        };
      },
      // 2. Multisig proof
      () => ({
        endpoint: "/api/v1/security/multisig-proof",
        timestamp: nowUnix,
        multisig: {
          hash: "0x" + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
          required_signatures: 5,
          signatures_collected: 5,
          validation: "SUCCESSFULLY_VERIFIED"
        }
      }),
      // 3. Pyth price-feed
      () => {
        const solPrice = (180 + Math.random() * 10).toFixed(3);
        const conf = (0.01 + Math.random() * 0.05).toFixed(4);
        return {
          endpoint: "/api/v1/pyth/price-feed",
          timestamp: nowUnix,
          pair: "SOL/USD",
          price: parseFloat(solPrice),
          confidence: parseFloat(conf),
          ema_price: parseFloat((parseFloat(solPrice) - 0.05).toFixed(3)),
          publish_time: nowUnix
        };
      },
      // 4. Jupiter routing
      () => ({
        endpoint: "/api/v1/jupiter/quote",
        timestamp: nowUnix,
        inputMint: "So11111111111111111111111111111111111111112",
        outputMint: "EPjFWcc5142ALgC4wu59pC38em9FFC3C1xaDKtd13cR",
        priceImpactPercent: parseFloat((Math.random() * 0.1).toFixed(3)),
        routePlan: [
          { poolId: "RaydiumCLMM", allocationPercent: 60 },
          { poolId: "OrcaWhirlpool", allocationPercent: 40 }
        ]
      }),
      // 5. Yield routes
      () => {
        const aprVal = (45 + Math.random() * 10).toFixed(1);
        return {
          endpoint: "/api/v1/yields/optimal-route",
          timestamp: nowUnix,
          pool_target: "SOL-USDC",
          raydium_clmm: {
            apr: `${aprVal}%`,
            allocation: "60%"
          },
          orca_whirlpool: {
            apr: "41.5%",
            allocation: "40%"
          }
        };
      },
      // 6. Helius Webhook
      () => {
        const dummySig = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        return {
          endpoint: "/api/v1/helius/webhook",
          timestamp: nowUnix,
          type: "USDC_SPL_TRANSFER",
          signature: "0x" + dummySig,
          fee: 5000,
          nativeTransfers: [
            {
              fromUserAccount: "HN7cAB...fK6p",
              toUserAccount: "HN7cAB...u9qR",
              amount: 10_000_000
            }
          ]
        };
      },
      // 7. Kamino lending
      () => {
        const apr = (11 + Math.random() * 4).toFixed(2);
        return {
          endpoint: "/api/v1/kamino/optimal-yield",
          timestamp: nowUnix,
          market: "MainMarket",
          asset: "USDC",
          depositApr: `${apr}%`,
          borrowApr: `${(parseFloat(apr) + 2).toFixed(2)}%`,
          netSupply: 5432000
        };
      },
      // 8. Tensor floor tracker
      () => ({
        endpoint: "/api/v1/tensor/floor-price",
        timestamp: nowUnix,
        collection: "MadLads",
        floorPriceSOL: parseFloat((95 + Math.random() * 15).toFixed(2)),
        dailyVolumeSOL: 4820,
        listingsCount: 142
      }),
      // 9. Drift orderbook
      () => ({
        endpoint: "/api/v1/drift/perp-market",
        timestamp: nowUnix,
        marketIndex: 0,
        oraclePrice: parseFloat((184.23 + Math.random() * 2).toFixed(2)),
        baseAssetReserve: 1054000,
        quoteAssetReserve: 98432000
      })
    ];

    const index = Math.floor(Math.random() * pool.length);
    const selectedObj = pool[index]();
    return JSON.stringify(selectedObj);
  }, []);

  const resolveProvider = useCallback((selected: LlmProvider, keyInput: string): Exclude<LlmProvider, "auto"> => {
    if (selected !== "auto") return selected;

    const openRouterKey = keyInput || localStorage.getItem("solagent_openrouter_api_key") || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    const candidates: Exclude<LlmProvider, "auto">[] = [];

    if (openRouterKey.trim()) candidates.push("openrouter");
    if (geminiKey.trim()) candidates.push("gemini");
    candidates.push("mock");

    return candidates[Math.floor(Math.random() * candidates.length)];
  }, []);

  // Step 4: Live AI Solver Driven by OpenRouter/Gemini
  const handleLiveAISolve = async (customId?: number) => {
    if (!connected || !publicKey) {
      triggerErrorPopup("Wallet Disconnected", "Please connect your Solana Wallet in Step 1 first.");
      return false;
    }

    const id = customId !== undefined ? customId : activeTab;
    const activeAgent = agents.find((a) => a.id === id);
    if (!activeAgent) {
      triggerErrorPopup("Agent PDA Missing", "Please register and spawn your Agent PDA in Step 2 first.");
      return false;
    }

    const requiredAmount = parseFloat(spendAmount);
    if (activeAgent.balance < requiredAmount) {
      addLog("error", `❌ [Agent #${id}] Insufficient funds in Agent PDA Vault. Active balance: $${activeAgent.balance.toFixed(2)}, Required: $${requiredAmount.toFixed(2)}.`);
      triggerErrorPopup("Insufficient Funds", `Agent #${id} has a balance of $${activeAgent.balance.toFixed(2)}, which is less than the requested transaction size of $${requiredAmount.toFixed(2)}. Please fund this agent in Step 3 first.`);
      return false;
    }

    const effectiveProvider = resolveProvider(llmProvider, apiKey.trim());
    const chosenServer = pickServerLabel(effectiveProvider, id);

    let activeKey = apiKey.trim();
    if (!activeKey) {
      if (effectiveProvider === "gemini") {
        activeKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
      } else if (effectiveProvider === "openrouter") {
        activeKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";
      }
    }

    if (effectiveProvider !== "mock" && !activeKey && effectiveProvider !== "ollama") {
      triggerErrorPopup("API Key Missing", "Please enter your API Key in the Advanced Config dropdown or set it in your environment (.env).");
      return false;
    }

    updateSolverState(id, "fetching");
    setSolverErrorMsg("");
    setConfirmedTxSignature("");
    addLog("info", `🤖 [Agent #${id}] Capturing Live AI Autopilot challenge...`);
    addLog("info", `🌐 [Agent #${id}] Routed to ${chosenServer} via ${effectiveProvider.toUpperCase()} provider.`);

    const mockChallenge = {
      error: "Payment Required",
      status: 402,
      amount: Math.round(parseFloat(spendAmount) * 1_000_000),
      mint: usdcMintInput.trim(),
      destination: merchantWallet.trim() || "F5FjAAU6y22eUisRo1dzm5L6ENB4XTNMUGxJrYKsUBvY",
      agentId: id,
    };

    addLog("warning", `📥 [Agent #${id}] Captured Paywall Challenge:`);
    addLog("info", `   - Target: ${mockChallenge.destination}`);
    addLog("info", `   - Budget Requested: $${(mockChallenge.amount / 1_000_000).toFixed(2)} orbmarkets.io`);

    const systemInstruction = `
You are an autonomous AI Agent equipped with a sandboxed Solana Token Vault.
You must parse the challenge and respond ONLY with a raw JSON block invoking the spend tool:
{
  "tool": "spend",
  "arguments": {
    "amount": ${mockChallenge.amount},
    "agentId": ${mockChallenge.agentId},
    "providerWallet": "${mockChallenge.destination}"
  }
}
Output raw JSON only. Do not wrap in markdown fences.
`;

    const userPrompt = `
Analyze and solve this paywall to continue execution:
${JSON.stringify(mockChallenge, null, 2)}
`;

    updateSolverState(id, "querying");
    addLog("info", `🧠 Querying ${effectiveProvider.toUpperCase()} cognitive model...`);

    let toolCallText = "";
    const queryStart = Date.now();

    try {
      if (effectiveProvider === "gemini") {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemInstruction }, { text: userPrompt }] }],
              generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
            }),
          });

          if (!res.ok) throw new Error(`Gemini API returned error: ${res.status}`);
          const data = await res.json();
          toolCallText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (geminiErr: any) {
          addLog("warning", `⚠️ Gemini API call failed (${geminiErr.message || geminiErr}). Attempting automatic failover to OpenRouter...`);
          
          const openRouterKey = localStorage.getItem("solagent_openrouter_api_key") || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || activeKey;
          const targetModel = modelName.trim() || "google/gemini-2.5-flash";
          
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openRouterKey.trim()}`,
              "HTTP-Referer": window.location.origin,
            },
            body: JSON.stringify({
              model: targetModel,
              messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.1,
            }),
          });

          if (!res.ok) throw new Error(`OpenRouter failover failed with status: ${res.status}`);
          const data = await res.json();
          toolCallText = data.choices?.[0]?.message?.content || "";
          addLog("success", `✅ OpenRouter failover succeeded using model: ${targetModel}`);
        }
      } else if (effectiveProvider === "openrouter") {
        const targetModel = modelName.trim() || "xiaomi/mimo-v2.5";
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeKey}`,
            "HTTP-Referer": window.location.origin,
          },
          body: JSON.stringify({
            model: targetModel,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.1,
          }),
        });

        if (!res.ok) throw new Error(`OpenRouter API error status: ${res.status}`);
        const data = await res.json();
        toolCallText = data.choices?.[0]?.message?.content || "";
      } else if (effectiveProvider === "ollama") {
        const targetModel = modelName.trim() || "qwen3:14b";
        const res = await fetch("http://localhost:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: targetModel,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: userPrompt },
            ],
            stream: false,
            options: { temperature: 0.1 },
          }),
        });

        if (!res.ok) throw new Error("Ollama node connection refused.");
        const data = await res.json();
        toolCallText = data.message?.content || "";
      } else {
        // Mock fallback simulator
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toolCallText = JSON.stringify({
          tool: "spend",
          arguments: {
            amount: mockChallenge.amount,
            agentId: mockChallenge.agentId,
            providerWallet: mockChallenge.destination,
          },
        });
      }

      const queryLatency = Date.now() - queryStart;
      const promptTokens = Math.round(systemInstruction.length / 4.2 + userPrompt.length / 4.2);
      const completionTokens = Math.round(toolCallText.length / 4.2);
      const modelNameVal = effectiveProvider === "gemini" ? "gemini-1.5-flash" :
                           effectiveProvider === "openrouter" ? modelName :
                           effectiveProvider === "ollama" ? modelName : "mock-cognitive-v2";

      setCognitiveTelemetry(prev => ({
        ...prev,
        [id]: {
          latency: queryLatency,
          promptTokens,
          completionTokens,
          systemInstruction,
          userPrompt,
          modelOutput: toolCallText,
          modelName: modelNameVal
        }
      }));

      const cleanJsonText = toolCallText.replace(/```json/g, "").replace(/```/g, "").trim();
      addLog("success", `📥 [Agent #${id}] LLM Reasoning parsed:`);
      addLog("info", cleanJsonText);

      const toolCall = JSON.parse(cleanJsonText);
      if (toolCall.tool === "spend" && toolCall.arguments) {
        const args = toolCall.arguments;
        const targetPubKey = new PublicKey(args.providerWallet);
        const amountBN = new anchor.BN(args.amount);
        const agentIdBN = new anchor.BN(args.agentId);

        updateSolverState(id, "signing");
        addLog("info", `⚙️ [Agent #${id}] Dispatching on-chain spend instruction...`);

        try {
          const agentKeypair = getAgentKeypair(args.agentId);
          const vaultPda = getVaultPda(publicKey);
          const agentPda = getAgentPda(vaultPda, args.agentId);
          const usdcMintKey = await resolveSupportedMint();

          const agentTokenAccount = getAssociatedTokenAddressSync(
            usdcMintKey,
            agentPda,
            true,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );

          const providerTokenAccount = getAssociatedTokenAddressSync(
            usdcMintKey,
            targetPubKey,
            true,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );

          // Ensure agentKeypair has SOL to pay transaction fees autonomously in the background!
          const signerSol = await connection.getBalance(agentKeypair.publicKey);
          if (signerSol < 20_000_000) { // < 0.02 SOL
            addLog("info", `🤖 [Agent #${id}] Funding autonomous agent hotkey with faucet SOL for zero-prompt background signing...`);
            try {
              const airdropSig = await connection.requestAirdrop(agentKeypair.publicKey, 200_000_000); // 0.2 SOL
              await connection.confirmTransaction(airdropSig, "confirmed");
              addLog("success", `✅ [Agent #${id}] Autonomous signer hotkey successfully funded with faucet SOL!`);
            } catch (airdropErr) {
              addLog("info", `🔑 Faucet busy. Requesting a quick 0.05 SOL faucet-transfer from your wallet to enable autonomous signing...`);
              const transferTx = new Transaction().add(
                SystemProgram.transfer({
                  fromPubkey: publicKey,
                  toPubkey: agentKeypair.publicKey,
                  lamports: 50_000_000, // 0.05 SOL
                })
              );
              const latest = await getLatestBlockhashWithRetry();
              transferTx.recentBlockhash = latest.blockhash;
              transferTx.feePayer = publicKey;
              const transferSig = await wallet.sendTransaction(transferTx, connection);
              await connection.confirmTransaction(transferSig, "confirmed");
              addLog("success", `✅ [Agent #${id}] Autonomous signer hotkey successfully funded from your wallet!`);
            }
          }

          // 1. Dynamic Check: Ensure Agent's ATA is initialized on-chain
          const agentAtaInfo = await connection.getAccountInfo(agentTokenAccount);
          if (!agentAtaInfo) {
            addLog("info", `🛠️ [Agent #${id}] Vault ATA missing. Deploying on-chain Associated Account...`);
            const tx = new Transaction().add(
              createAssociatedTokenAccountInstruction(
                agentKeypair.publicKey,
                agentTokenAccount,
                agentPda,
                usdcMintKey,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
              )
            );
            const latest = await getLatestBlockhashWithRetry();
            tx.recentBlockhash = latest.blockhash;
            tx.feePayer = agentKeypair.publicKey;
            
            addLog("info", `🤖 [Agent #${id}] Initializing Agent ATA autonomously...`);
            tx.sign(agentKeypair);
            const signature = await connection.sendRawTransaction(tx.serialize(), {
              skipPreflight: false,
              preflightCommitment: "confirmed",
            });
            await connection.confirmTransaction(signature, "confirmed");
            addLog("success", `✅ [Agent #${id}] Associated Account successfully initialized!`);
          }

          // 2. Dynamic Check: Ensure Merchant's ATA is initialized on-chain
          const providerAtaInfo = await connection.getAccountInfo(providerTokenAccount);
          if (!providerAtaInfo) {
            addLog("info", `🛠️ [Agent #${id}] Recipient merchant ATA missing. Deploying Associated Account...`);
            const tx = new Transaction().add(
              createAssociatedTokenAccountInstruction(
                agentKeypair.publicKey,
                providerTokenAccount,
                targetPubKey,
                usdcMintKey,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
              )
            );
            const latest = await getLatestBlockhashWithRetry();
            tx.recentBlockhash = latest.blockhash;
            tx.feePayer = agentKeypair.publicKey;

            addLog("info", `🤖 [Agent #${id}] Initializing Merchant ATA autonomously...`);
            tx.sign(agentKeypair);
            const signature = await connection.sendRawTransaction(tx.serialize(), {
              skipPreflight: false,
              preflightCommitment: "confirmed",
            });
            await connection.confirmTransaction(signature, "confirmed");
            addLog("success", `✅ [Agent #${id}] Merchant Associated Token Account deployed successfully!`);
          }

          addLog("info", `🔑 [Agent #${id}] Signing transaction autonomously via secure hotkey...`);

          const spendInstruction = await program.methods
            .spend(amountBN, agentIdBN)
            .accounts({
              agentState: agentPda,
              agentSigner: agentKeypair.publicKey,
              agentTokenAccount: agentTokenAccount,
              usdcMint: usdcMintKey,
              providerWallet: targetPubKey,
              providerTokenAccount: providerTokenAccount,
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction();

          const transaction = new Transaction().add(spendInstruction);
          transaction.feePayer = agentKeypair.publicKey;
          const latestBlockhash = await getLatestBlockhashWithRetry();
          transaction.recentBlockhash = latestBlockhash.blockhash;

          // Sign the transaction locally with the agent's simulatedSigner!
          transaction.sign(agentKeypair);

          addLog("info", `⚙️ [Agent #${id}] Submitting raw autonomous transaction to Devnet block...`);
          const txSignature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            preflightCommitment: "confirmed",
          });

          await connection.confirmTransaction(txSignature, "confirmed");

          try {
            const activeNetwork = typeof window !== "undefined" ? localStorage.getItem("solagent_network") : "devnet";
            const clusterParam = activeNetwork === "localnet"
              ? "cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899"
              : "cluster=devnet";
            const explorerUrl = `https://orbmarkets.io/tx/${txSignature}?${clusterParam}`;
            addLog("info", `🔍 Tx Signature: ${txSignature}`);
            addLog("success", `🔗 Solana Explorer Link: ${explorerUrl}`);
          } catch (openErr) {
            console.error("Failed to log explorer URL", openErr);
          }

          const beforeBalance = agents.find((agent) => agent.id === id)?.balance ?? 0;
          const spendDelta = -(args.amount / 1_000_000);
          recordTxEvent({
            type: "Agent Spend Payout",
            id,
            signature: txSignature,
            serverLabel: chosenServer,
            mode: "real",
            status: "confirmed",
            balanceBefore: beforeBalance,
            balanceAfter: Math.max(0, beforeBalance + spendDelta),
            delta: spendDelta,
          });
          addLog("success", `🎉 [Agent #${id}] Spending instruction confirmed! Transaction complete.`);
          setConfirmedTxSignature(txSignature);

          // Capstone Masterclass: 402 Paywall Decrypted secure payload flow
          addLog("info", `🛰️ [Agent #${id}] Requesting decrypted premium dataset from merchant paywall...`);
          await new Promise((resolve) => setTimeout(resolve, 800));

          const selectedPayload = generatePremiumJSON(id);

          addLog("success", `🔓 [Agent #${id}] Paywall decrypted! Secure payload released by merchant:`);
          addLog("success", `   >>> "${selectedPayload}"`);

          // Log premium data feed
          logDataFeed(id, selectedPayload, chosenServer, effectiveProvider);

          updateSolverState(id, "done");
          await reload();

          // Auto-reset solver state to idle after 4 seconds so that SVG bubble sweeps stop
          setTimeout(() => {
            updateSolverState(id, "idle");
          }, 4000);
          return true;
        } catch (txErr: any) {
          await appendSendTxLogs(txErr, `[Agent #${id}] ATA/Spend preflight`);
          const errMsg = txErr.message || "";
          const errStack = txErr.stack || "";
          const errStringified = (() => {
            try { return JSON.stringify(txErr); } catch { return ""; }
          })();
          const errCodeNumber = txErr.error?.errorCode?.number?.toString() || "";
          const errCodeName = txErr.error?.errorCode?.code || "";
          
          const fullErrText = `${errMsg} ${errStack} ${errStringified} ${errCodeNumber} ${errCodeName} ${txErr.toString()}`;
          
          // Specific Solana Token Program Insufficient Funds check
          if (
            fullErrText.toLowerCase().includes("insufficient funds") || 
            fullErrText.includes("custom program error: 0x1") ||
            fullErrText.includes("custom program error: 1")
          ) {
            addLog("error", "🛑 [ON-CHAIN REVERT] Spend failed: The Agent's Vault Token Account has Insufficient Funds! Please fund the agent first.");
            recordTxEvent({
              type: "Agent Spend Payout",
              id,
              serverLabel: chosenServer,
              mode: "real",
              status: "failed",
              message: errMsg || "Insufficient funds",
            });
            triggerErrorPopup("Agent Vault: Insufficient Token Balance", new Error("The Agent Vault Token Account does not have enough custom orbmarkets.io tokens to cover the paywall request. Please fund this agent in the fleet controller grid."));
            updateSolverState(id, "error");
            setSolverErrorMsg("Agent Vault has Insufficient Token Balance to complete this payment.");
            return false;
          }
          
          if (
            fullErrText.includes("6000") ||
            fullErrText.includes("6001") ||
            fullErrText.includes("6002") ||
            fullErrText.includes("6003") ||
            fullErrText.includes("6004") ||
            fullErrText.includes("AnchorError") ||
            fullErrText.includes("revert") ||
            fullErrText.includes("custom program error") ||
            fullErrText.includes("ExceedsMaxPerCall") ||
            fullErrText.includes("ExceedsRateLimit") ||
            fullErrText.includes("InsufficientBalance") ||
            fullErrText.includes("AgentNotActive") ||
            fullErrText.includes("ProviderNotAllowed") ||
            fullErrText.includes("single-call limit") ||
            fullErrText.includes("rate limit") ||
            fullErrText.includes("active") ||
            fullErrText.includes("allowed") ||
            fullErrText.includes("balance")
          ) {
            // This is a legitimate smart contract revert! Report it correctly!
            addLog("error", `🛑 [ON-CHAIN REVERT] Spend instruction blocked by security policy: ${errMsg || txErr.toString()}`);
            recordTxEvent({
              type: "Agent Spend Payout",
              id,
              serverLabel: chosenServer,
              mode: "real",
              status: "failed",
              message: errMsg || txErr.toString(),
            });
            triggerErrorPopup("Spending Policy Blocked Transaction", txErr);
            updateSolverState(id, "error");
            setSolverErrorMsg(errMsg || txErr.toString());
            return false;
          } else {
            if (!simulationMode) {
              addLog("error", `❌ Real mode: spend execution failed (${errMsg || txErr.toString()})`);
              recordTxEvent({
                type: "Agent Spend Payout",
                id,
                serverLabel: chosenServer,
                mode: "real",
                status: "failed",
                message: errMsg || txErr.toString(),
              });
              triggerErrorPopup("Spend Failed (Real Mode)", txErr);
              updateSolverState(id, "error");
              setSolverErrorMsg(errMsg || txErr.toString());
              return false;
            }

            console.warn("ATA accounts missing on-chain. Simulating confirm standard...", txErr);
            addLog("warning", "⚠️ Simulation Mode: token accounts not initialized, simulating signature.");

            await new Promise((resolve) => setTimeout(resolve, 1000));
            const fakeSignature = Array.from({ length: 4 }, () => Math.random().toString(36).substring(2)).join("") + "F5FjAA";
            setConfirmedTxSignature(fakeSignature);
            const beforeBalance = agents.find((agent) => agent.id === id)?.balance ?? 0;
            const spendDelta = -(args.amount / 1_000_000);
            recordTxEvent({
              type: "Agent Spend Payout",
              id,
              signature: fakeSignature,
              serverLabel: chosenServer,
              mode: "sim",
              status: "simulated",
              balanceBefore: beforeBalance,
              balanceAfter: Math.max(0, beforeBalance + spendDelta),
              delta: spendDelta,
              message: errMsg || txErr.toString(),
            });
            addLog("success", `🎉 Budget Authorized securely on-chain! Sent to address: ${targetPubKey.toBase58()}`);
            
            const selectedPayload = generatePremiumJSON(id);
            logDataFeed(id, selectedPayload, chosenServer, effectiveProvider);

            updateSolverState(id, "done");

            // Auto-reset solver state to idle after 4 seconds so that SVG bubble sweeps stop
            setTimeout(() => {
              updateSolverState(id, "idle");
            }, 4000);
            return true;
          }
        }
      } else {
        throw new Error("Model failed to output a compliant 'spend' payload.");
      }
    } catch (err: any) {
      console.error(err);
      updateSolverState(id, "error");
      setSolverErrorMsg(err.message || err.toString());
      addLog("error", `❌ AI Interception Failed: ${err.message || err.toString()}`);
      recordTxEvent({
        type: "Agent Spend Payout",
        id,
        serverLabel: chosenServer,
        mode: simulationMode ? "sim" : "real",
        status: "failed",
        message: err.message || err.toString(),
      });
      return false;
    }
  };

  // Specific Solver callback for Fleet Cards
  const handleLiveAISolveForAgent = async (id: number) => {
    setActiveTab(id);
    await new Promise((resolve) => setTimeout(resolve, 150));
    return handleLiveAISolve(id);
  };

  // Batch Solver for all active fleet agents in parallel
  const handleBatchRunSolvers = async () => {
    const activeAgents = agents.filter((a) => a.status === "Active" && a.balance >= parseFloat(spendAmount));
    if (activeAgents.length === 0) {
      addLog("warning", `No active agents with custom token balances >= $${parseFloat(spendAmount).toFixed(2)} available to run batch tests.`);
      return;
    }

    setActionLoading(true);

    // Pre-flight check: If in real mode, ensure all active agents have SOL for transaction fees
    if (!simulationMode && publicKey) {
      addLog("info", "🔍 Checking autonomous hotkey balances for all active agents before launching...");
      const agentsNeedingFund: PublicKey[] = [];
      for (const agent of activeAgents) {
        const agentKeypair = getAgentKeypair(agent.id);
        try {
          const bal = await connection.getBalance(agentKeypair.publicKey);
          if (bal < 20_000_000) { // < 0.02 SOL
            // Try devnet airdrop first
            try {
              const airdropSig = await connection.requestAirdrop(agentKeypair.publicKey, 100_000_000); // 0.1 SOL
              await connection.confirmTransaction(airdropSig, "confirmed");
              addLog("success", `✅ [Agent #${agent.id}] Signer hotkey successfully funded via faucet.`);
            } catch (airdropErr) {
              // Queue for bundled funding from user's wallet
              agentsNeedingFund.push(agentKeypair.publicKey);
            }
          }
        } catch (err) {
          console.error("Failed checking balance/airdrop for agent", agent.id, err);
          agentsNeedingFund.push(agentKeypair.publicKey);
        }
      }

      if (agentsNeedingFund.length > 0) {
        addLog("info", `🔑 Faucet busy. Requesting a single bundled transaction to pre-fund ${agentsNeedingFund.length} agent(s)...`);
        try {
          const transferTx = new Transaction();
          for (const targetPub of agentsNeedingFund) {
            transferTx.add(
              SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: targetPub,
                lamports: 50_000_000, // 0.05 SOL each
              })
            );
          }
          const latest = await getLatestBlockhashWithRetry();
          transferTx.recentBlockhash = latest.blockhash;
          transferTx.feePayer = publicKey;
          
          const transferSig = await wallet.sendTransaction(transferTx, connection);
          await connection.confirmTransaction(transferSig, "confirmed");
          addLog("success", `✅ Pre-funded all autonomous agent hotkeys with a single bundled transaction!`);
        } catch (txErr: any) {
          addLog("error", `❌ Failed to pre-fund agent hotkeys: ${txErr.message || txErr.toString()}`);
          setActionLoading(false);
          return;
        }
      }
    }

    addLog("info", "⚡ Firing Batch Fleet Autonomous Solvers in parallel concurrently...");

    try {
      const results = await Promise.all(
        activeAgents.map(async (agent) => {
          addLog("info", `🚀 Parallel Trigger: Launching AI Solver concurrently for Agent #${agent.id}...`);
          try {
            const ok = await handleLiveAISolve(agent.id);
            return { id: agent.id, ok: !!ok };
          } catch (e) {
            addLog("error", `❌ Parallel AI Solver failed for Agent #${agent.id}`);
            return { id: agent.id, ok: false };
          }
        })
      );

      const succeeded = results.filter((r) => r.ok).length;
      const failed = results.length - succeeded;
      if (failed > 0) {
        addLog("warning", `⚠️ Batch Fleet Solvers completed with failures (${succeeded} success / ${failed} failed).`);
      } else {
        addLog("success", `⚡ Batch Fleet Solvers finished successfully (${succeeded}/${results.length}).`);
      }
    } catch (err) {
      addLog("error", "❌ Batch Parallel Execution error.");
    }
    setActionLoading(false);
  };

  // Emergency halt for all active agents
  const handleEmergencyFleetFreeze = async () => {
    const activeAgents = agents.filter((a) => a.status === "Active");
    if (activeAgents.length === 0) {
      addLog("warning", "No active agents to freeze.");
      return;
    }

    setActionLoading(true);
    addLog("warning", "🔒 Triggering Fleet-wide Emergency Freeze on-chain...");

    for (const agent of activeAgents) {
      addLog("info", `🔒 Sequential Freeze: Halting spending permissions on-chain for Agent #${agent.id}...`);
      try {
        await handleTogglePause(agent);
      } catch (err) {
        addLog("error", `Halt failed for Agent #${agent.id}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    addLog("success", "🔒 Fleet secure! Emergency Freeze successfully executed across all active agents.");
    setActionLoading(false);
  };

  // Presentation Autopilot Simulation Loop
  const runAutopilotDemo = async () => {
    if (autoRunning) return;
    setAutoRunning(true);
    setActionLoading(true);
    setTerminalLogs([]);

    const steps = [
      { msg: "Seeding Browser Simulated Hot-key local state...", log: "Generating simulated hot-key keypair...", pct: 10, type: "info" },
      { msg: "Airdropping SOL reserves...", log: "SOL requested from Faucet... confirmed.", pct: 25, type: "success" },
      { msg: "Initializing on-chain Program Vault Registry...", log: "Vault Registry PDA deployed successfully.", pct: 40, type: "success" },
      { msg: "Spawning Agent #1 PDA with limits...", log: "Agent #1 spawned. Call limit: $5.00, Minute Rate: $15.00.", pct: 55, type: "success" },
      { msg: "Funding Vault Token Account with $10.00...", log: "Deposited $10.00 into agent vault. Balance updated.", pct: 70, type: "success" },
      { msg: "Running AI Autonomous Payment loop...", log: "AI parsed challenge. Paid $1.50 Lamports to merchant wallet. ✅", pct: 85, type: "success" },
      { msg: "Blocking Malicious Prompt Hack...", log: "🛑 [ON-CHAIN REVERT] Transaction Blocked! Amount exceeds Call Cap of $5.00 (ErrorCode: 6003).", pct: 100, type: "error" },
    ];

    for (let i = 0; i < steps.length; i++) {
      setAutopilotStepName(steps[i].msg);
      setStepPercent(steps[i].pct);
      addLog(steps[i].type as any, steps[i].log);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    setAutoRunning(false);
    setActionLoading(false);
    setAutopilotStepName("Playback Finished!");
    if (connected && publicKey) {
      await reload();
    }
  };

  const handleToggleStep = (step: number) => {
    setCurrentStep(step);
  };

  return {
    // Shared Solana configurations
    connected: !!connected,
    walletAddress: publicKey ? publicKey.toBase58() : "",
    solBalance,
    vaultInitialized,
    agents,
    loading,
    actionLoading,

    // Step flows
    currentStep,
    handleToggleStep,
    activeTab,
    setActiveTab,

    // Simulated Keys & Form inputs
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
    depositAmount,
    setDepositAmount,
    spendAmount,
    setSpendAmount,

    // Custom Token Tracker
    usdcMintInput,
    setUsdcMintInput,

    // LLM solver parameters
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

    // Diagnostics & autoplay
    faucetLoading,
    faucetStatus,
    terminalLogs,
    autoRunning,
    autopilotStepName,
    stepPercent,
    errorPopup,
    setErrorPopup,
    
    // Capstone Masterclass Telemetry exports
    txHistory,
    cognitiveTelemetry,
    dataFeeds,
    agentSolverStates,

    // Core callback functions
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
    runAutopilotDemo,
  };
}
