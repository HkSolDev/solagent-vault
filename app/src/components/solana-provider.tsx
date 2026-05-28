"use client";

import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Import standard wallet adapter UI styles
import "@solana/wallet-adapter-react-ui/styles.css";

export default function SolanaProvider({ children }: { children: React.ReactNode }) {
  // We target Local Surfpool network for local visual checks
  const endpoint = "http://127.0.0.1:8899";

  // Configure wallets to support Phantom, Solflare, and a burner wallet for simulator flow
  const wallets = useMemo(
    () => [
      new UnsafeBurnerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
