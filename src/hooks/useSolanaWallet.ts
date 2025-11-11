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
    // Wallet adapter handles connection UI - nothing to do here
    toast.success("Connect your Solana wallet from the popup");
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

      // Determine exercise type based on what's non-zero
      let exerciseType: "pullups" | "jumps";
      let score: number;

      if (pullups > 0) {
        exerciseType = "pullups";
        score = pullups;
      } else if (jumps > 0) {
        exerciseType = "jumps";
        score = jumps;
      } else {
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
          score,
          exerciseType
        );

        toast.success(
          `✅ ${exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} score submitted to Solana! Signature: ${signature.slice(0, 8)}...`
        );

        return { signature };
      } catch (error) {
        console.error("Error submitting score to Solana:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to submit score";
        setState((prev) => ({
          ...prev,
          solanaError: errorMsg,
        }));
        toast.error(`❌ Failed to submit ${exerciseType} score: ${errorMsg}`);
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
        const leaderboard = await getTopUsersFromSolana(limit);
        return leaderboard;
      } catch (error) {
        console.error("Error fetching Solana leaderboard:", error);
        return [];
      }
    },
    []
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
