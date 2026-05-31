"use client";

import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import "@solana/wallet-adapter-react-ui/styles.css";

export default function SolanaProvider({ children }: { children: React.ReactNode }) {
  // Read active cluster from localStorage with automatic Devnet default for online validation
  const endpoint = useMemo(() => {
    if (typeof window !== "undefined") {
      if (process.env.NEXT_PUBLIC_RPC_URL) {
        return process.env.NEXT_PUBLIC_RPC_URL;
      }
      
      const savedNetwork = localStorage.getItem("solagent_network");
      if (savedNetwork === "localnet") {
        return "http://127.0.0.1:8899"; // Local Surfpool Validator
      }
      
      // Default to live Devnet so that it works online immediately out of the box
      return "https://api.devnet.solana.com";
    }
    return "https://api.devnet.solana.com";
  }, []);

  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
