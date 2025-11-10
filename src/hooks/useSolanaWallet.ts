import { useCallback, useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { submitScoreToSolana, getTopUsersFromSolana } from "@/lib/solana/leaderboard";
import { PublicKey } from "@solana/web3.js";

interface UseSolanaWalletState {
  solanaAddress?: string;
  isSolanaConnected: boolean;
  isSolanaLoading: boolean;
  solanaError?: string;
}

export function useSolanaWallet() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected, signTransaction, disconnect } = wallet;

  const [state, setState] = useState<UseSolanaWalletState>({
    solanaAddress: publicKey?.toBase58(),
    isSolanaConnected: connected,
    isSolanaLoading: false,
  });

  // Update state when wallet connection changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      solanaAddress: publicKey?.toBase58(),
      isSolanaConnected: connected,
    }));
  }, [publicKey, connected]);

  const connectSolanaWallet = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isSolanaLoading: true,
      solanaError: undefined,
    }));

    try {
      // Wallet adapter handles connection UI
      // Just wait for the wallet to be connected
      // This is handled by the Solana wallet adapter modal
      toast.success("Connect your Solana wallet from the popup");
    } catch (error) {
      console.error("Error connecting Solana wallet:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to connect Solana wallet";
      setState((prev) => ({
        ...prev,
        isSolanaLoading: false,
        solanaError: errorMsg,
      }));
      toast.error(errorMsg);
    }
  }, []);

  const disconnectSolanaWallet = useCallback(async () => {
    try {
      await disconnect();
      setState((prev) => ({
        ...prev,
        solanaAddress: undefined,
        isSolanaConnected: false,
      }));
      toast.success("Disconnected from Solana wallet");
    } catch (error) {
      console.error("Error disconnecting Solana wallet:", error);
      toast.error("Failed to disconnect Solana wallet");
    }
  }, [disconnect]);

  const submitScoreToSolanaContract = useCallback(
    async (
      pullups: number,
      jumps: number,
      leaderboardAddress: PublicKey
    ): Promise<{ signature?: string }> => {
      if (!publicKey || !signTransaction || !connected) {
        toast.error("Please connect your Solana wallet first");
        return {};
      }

      if (pullups === 0 && jumps === 0) {
        toast.error("Please complete at least one exercise");
        return {};
      }

      try {
        setState((prev) => ({
          ...prev,
          isSolanaLoading: true,
        }));

        const signature = await submitScoreToSolana(
          connection,
          wallet,
          leaderboardAddress,
          pullups,
          jumps
        );

        toast.success(
          `Score submitted to Solana! Signature: ${signature.slice(0, 8)}...`
        );

        return { signature };
      } catch (error) {
        console.error("Error submitting score to Solana:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to submit score";
        setState((prev) => ({
          ...prev,
          solanaError: errorMsg,
        }));
        toast.error(errorMsg);
        return {};
      } finally {
        setState((prev) => ({
          ...prev,
          isSolanaLoading: false,
        }));
      }
    },
    [publicKey, signTransaction, connected, connection, wallet]
  );

  const getSolanaLeaderboard = useCallback(
    async (limit: number = 10) => {
      try {
        const leaderboard = await getTopUsersFromSolana(connection, limit);
        return leaderboard;
      } catch (error) {
        console.error("Error fetching Solana leaderboard:", error);
        return [];
      }
    },
    [connection]
  );

  return {
    // State
    solanaAddress: state.solanaAddress,
    isSolanaConnected: state.isSolanaConnected,
    isSolanaLoading: state.isSolanaLoading,
    solanaError: state.solanaError,

    // Actions
    connectSolanaWallet,
    disconnectSolanaWallet,
    submitScoreToSolanaContract,
    getSolanaLeaderboard,

    // Raw wallet
    wallet,
  };
}
