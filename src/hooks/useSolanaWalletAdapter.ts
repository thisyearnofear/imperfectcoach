import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { solanaWalletManager } from "@/lib/payments/solana-wallet-adapter";

export const useSolanaWalletAdapter = () => {
  // Initialize with current state from manager
  const [state, setState] = useState(solanaWalletManager.getState());

  // Subscribe to manager updates
  useEffect(() => {
    // Update state immediately
    setState(solanaWalletManager.getState());

    // Subscribe to changes
    const unsubscribe = solanaWalletManager.on("change", (newState) => {
      setState({ ...newState });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const connectSolanaWallet = useCallback(async () => {
    try {
      await solanaWalletManager.connect("phantom"); // Default to phantom for now, or use preferred
      toast.success("Solana wallet connected!");
    } catch (error) {
      console.error("Solana connection error:", error);
      toast.error("Failed to connect Solana wallet");
    }
  }, []);

  const disconnectSolanaWallet = useCallback(async () => {
    try {
      await solanaWalletManager.disconnect();
      toast.success("Solana wallet disconnected");
    } catch (error) {
      console.error("Solana disconnect error:", error);
      toast.error("Failed to disconnect Solana wallet");
    }
  }, []);

  return {
    // State
    solanaPublicKey: state.publicKey,
    isSolanaConnected: state.connected,
    isSolanaConnecting: state.connecting,
    connection: state.connection,
    
    // Actions
    connectSolanaWallet,
    disconnectSolanaWallet,
  };
};