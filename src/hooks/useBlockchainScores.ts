import { useCallback, useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractConfig } from '@/lib/contracts';
import { BlockchainScore, Exercise } from '@/lib/types';
import { toast } from 'sonner';

interface UseBlockchainScoresReturn {
  leaderboard: BlockchainScore[];
  isLoading: boolean;
  error?: string;
  submitScore: (pullups: number, jumps: number) => Promise<void>;
  isSubmitting: boolean;
  canSubmit: boolean;
  timeUntilNextSubmission: number;
  refetch: () => void;
}

export const useBlockchainScores = (): UseBlockchainScoresReturn => {
  const [leaderboard, setLeaderboard] = useState<BlockchainScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeUntilNextSubmission, setTimeUntilNextSubmission] = useState(0);

  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const contractConfig = getContractConfig();

  // Read leaderboard data
  const { data: leaderboardData, refetch: refetchLeaderboard } = useReadContract({
    ...contractConfig,
    functionName: 'getLeaderboard',
  });

  // Read cooldown time for current user
  const { data: cooldownData, refetch: refetchCooldown } = useReadContract({
    ...contractConfig,
    functionName: 'getTimeUntilNextSubmission',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Process leaderboard data
  useEffect(() => {
    if (leaderboardData && Array.isArray(leaderboardData)) {
      const processedData: BlockchainScore[] = leaderboardData.map((score: any) => ({
        user: score.user,
        pullups: Number(score.pullups),
        jumps: Number(score.jumps),
        timestamp: Number(score.timestamp),
      }));
      setLeaderboard(processedData);
    }
  }, [leaderboardData]);

  // Process cooldown data
  useEffect(() => {
    if (cooldownData !== undefined) {
      setTimeUntilNextSubmission(Number(cooldownData));
    }
  }, [cooldownData]);

  // Submit score to blockchain
  const submitScore = useCallback(async (pullups: number, jumps: number) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }



    if (timeUntilNextSubmission > 0) {
      toast.error(`Please wait ${Math.ceil(timeUntilNextSubmission / 60)} minutes before submitting again`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(undefined);

      // Write to contract
      writeContract(
        {
          ...contractConfig,
          functionName: 'addScore',
          args: [BigInt(pullups), BigInt(jumps)],
        },
        {
          onSuccess: (hash) => {
            toast.success('Score submitted to blockchain!');
            // Refetch data after successful submission
            setTimeout(() => {
              refetchLeaderboard();
              refetchCooldown();
            }, 2000);
          },
          onError: (error) => {
            console.error('Error submitting score:', error);
            let errorMessage = 'Failed to submit score';
            
            if (error.message.includes('CooldownNotExpired')) {
              errorMessage = 'Please wait before submitting again';
            } else if (error.message.includes('ScoreExceedsMaximum')) {
              errorMessage = 'Score exceeds maximum allowed value';
            } else if (error.message.includes('SubmissionsDisabled')) {
              errorMessage = 'Score submissions are currently disabled';
            }
            
            toast.error(errorMessage);
            setError(errorMessage);
          },
          onSettled: () => {
            setIsSubmitting(false);
          },
        }
      );

    } catch (error) {
      console.error('Error in submitScore:', error);
      setIsSubmitting(false);
      setError('Failed to submit score');
      toast.error('Failed to submit score');
    }
  }, [isConnected, address, contractConfig, timeUntilNextSubmission, writeContract, refetchLeaderboard, refetchCooldown]);

  // Refetch function
  const refetch = useCallback(() => {
    refetchLeaderboard();
    refetchCooldown();
  }, [refetchLeaderboard, refetchCooldown]);

  // Auto-refresh cooldown timer
  useEffect(() => {
    if (timeUntilNextSubmission > 0) {
      const interval = setInterval(() => {
        setTimeUntilNextSubmission(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeUntilNextSubmission]);

  return {
    leaderboard,
    isLoading,
    error,
    submitScore,
    isSubmitting,
    canSubmit: isConnected && timeUntilNextSubmission === 0,
    timeUntilNextSubmission,
    refetch,
  };
};
