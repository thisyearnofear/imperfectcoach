import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  JUMPS_LEADERBOARD_CONFIG,
  PULLUPS_LEADERBOARD_CONFIG,
} from "@/lib/contracts";
import {
  getTopUsersFromSolana,
  SOLANA_LEADERBOARD_PROGRAM_ID,
} from "@/lib/solana/leaderboard";
import { useReadContract } from "wagmi";

export interface UnifiedLeaderboardEntry {
  user: string; // 0x... (Base) or Solana pubkey string
  chain: "base" | "solana";
  pullups: number;
  jumps: number;
  totalScore: number;
  submissionCount: number;
  lastSubmissionTime: number;
  rank?: number;
}

export type ChainFilter = "all" | "base" | "solana";

interface UseLeaderboardParallelOptions {
  limit?: number;
  chain?: ChainFilter;
  enabled?: boolean;
}

/**
 * Hook for reading leaderboard from both Base and Solana contracts in parallel
 * Merges results and sorts by total score
 */
export function useLeaderboardParallel(options: UseLeaderboardParallelOptions = {}) {
  const { limit = 10, chain = "all", enabled = true } = options;

  const { connection } = useConnection();
  const [solanaLeaderboard, setSolanaLeaderboard] = useState<UnifiedLeaderboardEntry[]>([]);
  const [isSolanaLoading, setIsSolanaLoading] = useState(false);
  const [solanaError, setSolanaError] = useState<string | null>(null);

  // Base leaderboard reads (existing)
  const {
    data: jumpsLeaderboardData,
    isLoading: isJumpsLoading,
    error: jumpsError,
    refetch: refetchJumpsLeaderboard,
  } = useReadContract({
    ...JUMPS_LEADERBOARD_CONFIG,
    functionName: "getTopUsers",
    args: [limit],
    chainId: 84532,
    query: {
      enabled: enabled && (chain === "all" || chain === "base"),
      staleTime: 60000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  });

  const {
    data: pullupsLeaderboardData,
    isLoading: isPullupsLoading,
    error: pullupsError,
    refetch: refetchPullupsLeaderboard,
  } = useReadContract({
    ...PULLUPS_LEADERBOARD_CONFIG,
    functionName: "getTopUsers",
    args: [limit],
    chainId: 84532,
    query: {
      enabled: enabled && (chain === "all" || chain === "base"),
      staleTime: 60000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  });

  // Fetch Solana leaderboard in parallel
  const fetchSolanaLeaderboard = useCallback(async () => {
    if (!enabled || (chain !== "all" && chain !== "solana")) {
      setSolanaLeaderboard([]);
      return;
    }

    try {
      setIsSolanaLoading(true);
      setSolanaError(null);

      // For now, return empty array - getTopUsersFromSolana returns [] until program deployed
      // This ensures parallel fetch structure is in place
      const solanaEntries = await getTopUsersFromSolana(connection, limit);

      // Convert Solana entries to unified format
      const unified: UnifiedLeaderboardEntry[] = solanaEntries.map((entry) => ({
        user: entry.user,
        chain: "solana",
        pullups: Number(entry.pullups),
        jumps: Number(entry.jumps),
        totalScore: Number(entry.pullups) + Number(entry.jumps),
        submissionCount: Number(entry.submissionCount),
        lastSubmissionTime: Number(entry.lastSubmissionTime),
      }));

      setSolanaLeaderboard(unified);
      setIsSolanaLoading(false);
    } catch (error) {
      console.error("Error fetching Solana leaderboard:", error);
      setSolanaError(error instanceof Error ? error.message : "Failed to fetch Solana leaderboard");
      setIsSolanaLoading(false);
    }
  }, [connection, limit, enabled, chain]);

  // Fetch Solana leaderboard when enabled or chain filter changes
  useEffect(() => {
    fetchSolanaLeaderboard();
  }, [fetchSolanaLeaderboard]);

  // Combine and process leaderboard data
  const leaderboard = useMemo(() => {
    const combined: UnifiedLeaderboardEntry[] = [];

    // Process Base leaderboard
    if (chain === "all" || chain === "base") {
      const userMap = new Map<
        string,
        {
          pullups: number;
          jumps: number;
          lastSubmissionTime: number;
        }
      >();

      // Process jumps data
      if (jumpsLeaderboardData && Array.isArray(jumpsLeaderboardData)) {
        jumpsLeaderboardData.forEach(
          (entry: {
            user: string;
            totalScore: bigint;
            lastSubmissionTime: bigint;
          }) => {
            userMap.set(entry.user, {
              pullups: 0,
              jumps: Number(entry.totalScore),
              lastSubmissionTime: Number(entry.lastSubmissionTime),
            });
          }
        );
      }

      // Process pullups data and merge
      if (pullupsLeaderboardData && Array.isArray(pullupsLeaderboardData)) {
        pullupsLeaderboardData.forEach(
          (entry: {
            user: string;
            totalScore: bigint;
            lastSubmissionTime: bigint;
          }) => {
            const existing = userMap.get(entry.user);
            if (existing) {
              existing.pullups = Number(entry.totalScore);
              existing.lastSubmissionTime = Math.max(
                existing.lastSubmissionTime,
                Number(entry.lastSubmissionTime)
              );
            } else {
              userMap.set(entry.user, {
                pullups: Number(entry.totalScore),
                jumps: 0,
                lastSubmissionTime: Number(entry.lastSubmissionTime),
              });
            }
          }
        );
      }

      // Convert map to unified format
      userMap.forEach((data, user) => {
        combined.push({
          user,
          chain: "base",
          pullups: data.pullups,
          jumps: data.jumps,
          totalScore: data.pullups + data.jumps,
          submissionCount: 1, // Base leaderboards don't track this directly
          lastSubmissionTime: data.lastSubmissionTime,
        });
      });
    }

    // Add Solana leaderboard
    if (chain === "all" || chain === "solana") {
      combined.push(...solanaLeaderboard);
    }

    // Sort by total score descending
    combined.sort((a, b) => b.totalScore - a.totalScore);

    // Add ranks
    combined.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return combined;
  }, [jumpsLeaderboardData, pullupsLeaderboardData, solanaLeaderboard, chain]);

  return {
    leaderboard,
    isLoading: isJumpsLoading || isPullupsLoading || isSolanaLoading,
    error: jumpsError?.message || pullupsError?.message || solanaError,
    refetch: async () => {
      await Promise.all([refetchJumpsLeaderboard(), refetchPullupsLeaderboard()]);
      await fetchSolanaLeaderboard();
    },
  };
}
