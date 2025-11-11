import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useCallback } from "react";
import { toast } from "sonner";

export const useSolanaWalletAdapter = () => {
  const {
    publicKey: solanaPublicKey,
    connected: isSolanaConnected,
    connecting: isSolanaConnecting,
    connect: connectSolanaAdapter,
    disconnect: disconnectSolanaAdapter,
  } = useWallet();
  const { connection } = useConnection();

  const connectSolanaWallet = useCallback(async () => {
    try {
      await connectSolanaAdapter();
      toast.success("Solana wallet connected!");
    } catch (error) {
      console.error("Solana connection error:", error);
      toast.error("Failed to connect Solana wallet");
    }
  }, [connectSolanaAdapter]);

  const disconnectSolanaWallet = useCallback(async () => {
    try {
      await disconnectSolanaAdapter();
      toast.success("Solana wallet disconnected");
    } catch (error) {
      console.error("Solana disconnect error:", error);
      toast.error("Failed to disconnect Solana wallet");
    }
  }, [disconnectSolanaAdapter]);

  return {
    // State
    solanaPublicKey,
    isSolanaConnected,
    isSolanaConnecting,
    connection,
    
    // Actions
    connectSolanaWallet,
    disconnectSolanaWallet,
  };
};