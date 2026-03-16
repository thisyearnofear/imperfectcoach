import React, { useMemo, FC, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { SOLANA_RPC_URL } from "@/lib/solana/config";

// Import Solana wallet styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaProviderProps {
  children: ReactNode;
}

/**
 * Solana Provider wrapper
 * Sets up connection and wallet adapters for Solana integration
 * Uses Solana Devnet for Phase 1 (matches Base Sepolia environment)
 */
export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  // Use centralized RPC config (Helius when available, public devnet fallback)
  const endpoint = useMemo(() => SOLANA_RPC_URL, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // Can add more wallet adapters here (Ledger, Glow, etc.)
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
};

export default SolanaProvider;
