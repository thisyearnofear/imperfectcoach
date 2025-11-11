import { useCallback, useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { toast } from "sonner";
import { getContractConfig } from "@/lib/contracts";
import { trackTransaction, analyzeTransactionError } from "@/lib/cdp";
import { submitScoreToSolana, type ExerciseType } from "@/lib/solana/leaderboard";
import type { PublicKey } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

interface ScoreSubmissionState {
  isSubmittingScore: boolean;
  lastHash?: string;
  submitError?: string;
}

export const useScoreSubmission = (
  // Base wallet state
  isConnected: boolean,
  address: string | undefined,

  // Solana wallet state
  isSolanaConnected: boolean,
  solanaPublicKey: PublicKey | null | undefined,
  connection: Connection | undefined,

  // Refresh function
  refreshLeaderboard: (() => Promise<void>) | undefined
) => {
  const [submissionState, setSubmissionState] = useState<ScoreSubmissionState>({
    isSubmittingScore: false,
  });

  // Base blockchain submission
  const { writeContract, data: writeContractData } = useWriteContract();
  const { data: txHash, isLoading: isTxPending } = useWaitForTransactionReceipt({
    hash: submissionState.lastHash as `0x${string}`,
  });

  // Track write contract data changes
  useEffect(() => {
    if (writeContractData) {
      setSubmissionState(prev => ({ ...prev, lastHash: writeContractData }));
    }
  }, [writeContractData]);

  // Consolidated submission handler (DRY principle)
  const handleSubmission = useCallback(async (
    submissionFn: () => Promise<{ hash?: string }>,
    chain: 'base' | 'solana',
    exercise: string
  ) => {
    try {
      setSubmissionState(prev => ({ ...prev, isSubmittingScore: true, submitError: undefined }));

      const result = await submissionFn();

      if (result.hash) {
        setSubmissionState(prev => ({ ...prev, lastHash: result.hash }));

        // Track for Base transactions
        if (chain === 'base') {
          trackTransaction(result.hash);
        }

        toast.success(`${exercise} score submitted to ${chain === 'base' ? 'Base' : 'Solana'}!`);

        // Refresh leaderboard after successful submission
        if (refreshLeaderboard) {
          await refreshLeaderboard();
        }
      }

      return result;
    } catch (error: any) {
      console.error(`Error submitting ${exercise} score to ${chain}:`, error);

      let errorMessage = `Failed to submit score to ${chain === 'base' ? 'Base' : 'Solana'}`;

      if (chain === 'base') {
        const analysis = await analyzeTransactionError(error);
        errorMessage = analysis?.suggestion || error?.message || errorMessage;
      } else {
        errorMessage = error.message || errorMessage;
      }

      setSubmissionState(prev => ({ ...prev, submitError: errorMessage }));
      toast.error(errorMessage);
      throw error;
    } finally {
      setSubmissionState(prev => ({ ...prev, isSubmittingScore: false }));
    }
  }, [refreshLeaderboard]);

  const submitToBase = useCallback(async (exercise: "jumps" | "pullups", score: number) => {
    if (!isConnected || !address) {
      toast.error("Please connect your Base wallet first");
      return;
    }

    return handleSubmission(async () => {
      const contractConfig = getContractConfig(exercise);

      // Call writeContract - it triggers the transaction and wagmi manages the hash internally
      writeContract({
        address: contractConfig.address as `0x${string}`,
        abi: contractConfig.abi,
        functionName: "addScore",
        args: [address, score],
        chain: baseSepolia,
        account: address as `0x${string}`,
      });

      // The transaction hash will be automatically tracked by wagmi's useWaitForTransactionReceipt
      // Return empty object as the hash is managed by the hook
      return {};
    }, 'base', exercise);
  }, [isConnected, address, writeContract, handleSubmission]);

  const submitToSolana = useCallback(async (exercise: ExerciseType, score: number, leaderboardAddress: PublicKey, wallet: WalletContextState) => {
    if (!isSolanaConnected || !solanaPublicKey || !connection) {
      toast.error("Please connect your Solana wallet first");
      return;
    }

    return handleSubmission(async () => {
      const signature = await submitScoreToSolana(
        connection,
        wallet,
        leaderboardAddress,
        score,
        exercise
      );

      return { hash: signature };
    }, 'solana', exercise);
  }, [isSolanaConnected, solanaPublicKey, connection, handleSubmission]);

  // Single exercise submission with chain choice
  const submitSingleExercise = useCallback(
    async (exercise: ExerciseType, score: number, targetChain?: 'base' | 'solana'): Promise<{ hash?: string }> => {
      if (score <= 0) {
        toast.error(`Invalid ${exercise} score: ${score}`);
        throw new Error(`Invalid score: ${score}`);
      }

      // Determine target chain (prioritize Solana if both connected and no preference specified)
      const chosenChain = targetChain || (isSolanaConnected && solanaPublicKey ? 'solana' : 'base');

      if (chosenChain === 'solana') {
        if (!isSolanaConnected || !solanaPublicKey || !connection) {
          toast.error("Please connect your Solana wallet first");
          throw new Error("Solana wallet not connected");
        }

        console.log(`🟣 Submitting ${exercise} score (${score}) to Solana blockchain`);

        // Get leaderboard address for this exercise
        const { getLeaderboardAddress } = await import("@/lib/solana/config");
        const leaderboardAddress = getLeaderboardAddress(exercise);
        const wallet = { publicKey: solanaPublicKey } as WalletContextState; // Simplified wallet object

        return await submitToSolana(exercise, score, leaderboardAddress, wallet);
      } else {
        if (!isConnected || !address) {
          toast.error("Please connect your Base wallet first");
          throw new Error("Base wallet not connected");
        }

        console.log(`🔵 Submitting ${exercise} score (${score}) to Base blockchain`);
        return await submitToBase(exercise, score);
      }
    },
    [
      isConnected,
      address,
      isSolanaConnected,
      solanaPublicKey,
      connection,
      submitToBase,
      submitToSolana,
    ]
  );

  // Legacy function for backward compatibility - now routes to single exercise submission
  const submitScore = useCallback(
    async (pullups: number, jumps: number): Promise<{ hash?: string }> => {
      // Determine which exercise to submit based on non-zero values
      if (pullups > 0 && jumps > 0) {
        toast.error("Cannot submit both exercises in one transaction. Please submit one at a time.");
        throw new Error("Multiple exercises not supported - submit one exercise at a time");
      }

      if (pullups > 0) {
        return await submitSingleExercise("pullups", pullups);
      } else if (jumps > 0) {
        return await submitSingleExercise("jumps", jumps);
      } else {
        toast.error("No valid exercise scores to submit");
        throw new Error("No valid scores provided");
      }
    },
    [submitSingleExercise]
  );

  return {
    // State
    isSubmittingScore: submissionState.isSubmittingScore || isTxPending,
    submitError: submissionState.submitError,
    lastHash: submissionState.lastHash,

    // Actions
    submitScore, // Legacy dual-exercise function (now enforces single exercise)
    submitSingleExercise, // New preferred single exercise submission
    submitToBase,
    submitToSolana,
  };
};