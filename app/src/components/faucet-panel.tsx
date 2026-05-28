"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function FaucetPanel() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch the wallet's devnet SOL balance
  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const bal = await connection.getBalance(publicKey);
      setSolBalance(bal / LAMPORTS_PER_SOL);
      
      // Setup default placeholder USDC balance
      // In a full integration, we would read the ATA balance for the Devnet USDC mint.
      // For visual dashboard playground verification, we start with a beautiful mock.
      setUsdcBalance(100.0); 
    } catch (err) {
      console.error("Failed to fetch balance", err);
    }
  }, [publicKey, connection]);

  // Request a Devnet SOL airdrop
  const claimAirdrop = async () => {
    if (!publicKey) return;
    setLoading(true);
    setStatusMsg({ text: "Requesting airdrop from devnet faucet...", isError: false });
    
    try {
      const sig = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
      
      // Wait for transaction confirmation
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: sig,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight
      }, "confirmed");
      
      setStatusMsg({ text: "Airdrop claimed successfully! 🎉", isError: false });
      await fetchBalance();
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ text: "Airdrop limit reached or RPC busy. Try again soon!", isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && connected && publicKey) {
      fetchBalance();
      // Set up periodic balance polling
      const id = setInterval(fetchBalance, 10000);
      return () => clearInterval(id);
    } else {
      setSolBalance(null);
      setUsdcBalance(null);
    }
  }, [mounted, connected, publicKey, fetchBalance]);

  if (!mounted) {
    return (
      <div className="glass-panel p-6 rounded-xl w-full max-w-md mx-auto flex flex-col gap-5 mt-8 border border-glass-border animate-pulse min-h-[250px]">
        <div className="flex justify-between items-center">
          <div className="h-6 w-24 bg-white/10 rounded" />
          <div className="h-4 w-12 bg-white/10 rounded" />
        </div>
        <div className="h-4 w-full bg-white/10 rounded mt-2" />
        <div className="h-10 w-44 bg-white/10 mx-auto rounded-md mt-4" />
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-xl w-full max-w-md mx-auto flex flex-col gap-5 mt-8 border border-glass-border">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
          <span>⚡</span> DEVNET PLAYGROUND
        </h3>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-vivid-cyan/10 text-vivid-cyan border border-vivid-cyan/20 rounded">
          Active
        </span>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed font-mono">
        Connect your browser wallet to switch to Solana Devnet. Use the faucet below to claim free testing funds.
      </p>

      {/* Wallet Connection Trigger */}
      <div className="flex justify-center my-2">
        <WalletMultiButton className="!bg-electric-purple hover:!bg-electric-purple/90 !font-mono !text-sm !h-11 !rounded-md shadow-glow-purple" />
      </div>

      {/* Balances View */}
      {connected && publicKey && (
        <div className="flex flex-col gap-3 p-4 rounded bg-white/5 border border-glass-border font-mono text-sm">
          <div className="flex justify-between items-center text-zinc-300">
            <span>Your Wallet:</span>
            <span className="text-xs text-zinc-500">
              {publicKey.toBase58().substring(0, 4)}...{publicKey.toBase58().substring(publicKey.toBase58().length - 4)}
            </span>
          </div>
          <div className="h-px bg-glass-border" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Devnet SOL:</span>
            <span className="font-bold text-vivid-cyan">
              {solBalance !== null ? `${solBalance.toFixed(3)} SOL` : "Loading..."}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Playground USDC:</span>
            <span className="font-bold text-electric-purple">
              {usdcBalance !== null ? `$${usdcBalance.toFixed(2)} USDC` : "Loading..."}
            </span>
          </div>
        </div>
      )}

      {/* Airdrop Faucet Button */}
      {connected && publicKey && (
        <div className="flex flex-col gap-3">
          <button
            onClick={claimAirdrop}
            disabled={loading}
            className={`w-full py-2.5 rounded font-mono text-sm font-semibold transition-all select-none ${
              loading
                ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                : "bg-vivid-cyan/15 hover:bg-vivid-cyan/25 text-vivid-cyan border border-vivid-cyan/35 shadow-glow-cyan"
            }`}
          >
            {loading ? "Processing..." : "Claim 1.0 Devnet SOL 🪂"}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {statusMsg && (
        <div
          className={`text-center font-mono text-[11px] p-2 rounded ${
            statusMsg.isError
              ? "bg-emergency-red/10 border border-emergency-red/20 text-emergency-red"
              : "bg-success-emerald/10 border border-success-emerald/20 text-success-emerald"
          }`}
        >
          {statusMsg.text}
        </div>
      )}
    </div>
  );
}
