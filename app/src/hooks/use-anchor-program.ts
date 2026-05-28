"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../idl/solagent_vault.json";

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    // Standard program address loaded directly from IDL
    const programId = new PublicKey(idl.address);

    // Create AnchorProvider. If wallet is not connected, we mock a dummy wallet for read-only actions
    const providerWallet = wallet.publicKey 
      ? {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction!,
          signAllTransactions: wallet.signAllTransactions!,
        }
      : {
          publicKey: PublicKey.default,
          signTransaction: async (tx: any) => tx,
          signAllTransactions: async (txs: any) => txs,
        };

    const provider = new AnchorProvider(connection, providerWallet as any, {
      commitment: "confirmed",
    });

    // Return the program instance typed using our IDL
    return new Program(idl as Idl, provider);
  }, [connection, wallet]);

  return program;
}
