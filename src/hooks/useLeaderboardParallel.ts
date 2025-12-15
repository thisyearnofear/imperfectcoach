import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  JUMPS_LEADERBOARD_CONFIG,
  PULLUPS_LEADERBOARD_CONFIG,
  JUMPS_LEADERBOARD_ADDRESSES,
  PULLUPS_LEADERBOARD_ADDRESSES,
  EXERCISE_LEADERBOARD_ABI,
} from "@/lib/contracts";
import {
  getTopUsersFromSolana,
  SOLANA_LEADERBOARD_PROGRAM_ID,
} from "@/lib/solana/leaderboard";
import { useReadContract } from "wagmi";
import { CHAIN_IDS } from "@/lib/config";

export interface UnifiedLeaderboardEntry {
  user: string; // 0x... (Base/Avalanche) or Solana pubkey string
  chain: "base" | "avalanche" | "solana";
  pullups: number;
  jumps: number;
  totalScore: number;
  submissionCount: number;
  lastSubmissionTime: number;
  rank?: number;
}

export type ChainFilter = "all" | "base" | "avalanche" | "solana";

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
  const [avalancheLeaderboard, setAvalancheLeaderboard] = useState<UnifiedLeaderboardEntry[]>([]);
  const [isSolanaLoading, setIsSolanaLoading] = useState(false);
  const [isAvalancheLoading, setIsAvalancheLoading] = useState(false);
  const [solanaError, setSolanaError] = useState<string | null>(null);
  const [avalancheError, setAvalancheError] = useState<string | null>(null);

  // Base leaderboard reads (existing)
  const {
    data: jumpsLeaderboardData,
    isLoading: isJumpsLoading,
    error: jumpsError,
    refetch: refetchJumpsLeaderboard,
  } = useReadContract({
    address: JUMPS_LEADERBOARD_CONFIG.address as `0x${string}`,
    abi: JUMPS_LEADERBOARD_CONFIG.abi,
    functionName: "getTopUsers",
    args: [BigInt(limit)],
    chainId: CHAIN_IDS.BASE_SEPOLIA,
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
    address: PULLUPS_LEADERBOARD_CONFIG.address as `0x${string}`,
    abi: PULLUPS_LEADERBOARD_CONFIG.abi,
    functionName: "getTopUsers",
    args: [BigInt(limit)],
    chainId: CHAIN_IDS.BASE_SEPOLIA,
    query: {
      enabled: enabled && (chain === "all" || chain === "base"),
      staleTime: 60000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  });

  // Avalanche leaderboard reads
  const {
    data: avalancheJumpsLeaderboardData,
    isLoading: isAvalancheJumpsLoading,
    error: avalancheJumpsError,
    refetch: refetchAvalancheJumpsLeaderboard,
  } = useReadContract({
    address: JUMPS_LEADERBOARD_ADDRESSES["avalanche-fuji"] as `0x${string}`,
    abi: EXERCISE_LEADERBOARD_ABI,
    functionName: "getTopUsers",
    args: [BigInt(limit)],
    chainId: CHAIN_IDS.AVALANCHE_FUJI,
    query: {
      enabled: enabled && (chain === "all" || chain === "avalanche"),
      staleTime: 60000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  });

  const {
    data: avalanchePullupsLeaderboardData,
    isLoading: isAvalanchePullupsLoading,
    error: avalanchePullupsError,
    refetch: refetchAvalanchePullupsLeaderboard,
  } = useReadContract({
    address: PULLUPS_LEADERBOARD_ADDRESSES["avalanche-fuji"] as `0x${string}`,
    abi: EXERCISE_LEADERBOARD_ABI,
    functionName: "getTopUsers",
    args: [BigInt(limit)],
    chainId: CHAIN_IDS.AVALANCHE_FUJI,
    query: {
      enabled: enabled && (chain === "all" || chain === "avalanche"),
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
      const solanaEntries = await getTopUsersFromSolana(limit);

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

  // Fetch Avalanche leaderboard data
  const fetchAvalancheLeaderboard = useCallback(() => {
    if (!enabled || (chain !== "all" && chain !== "avalanche")) {
      setAvalancheLeaderboard([]);
      return;
    }

    try {
      setIsAvalancheLoading(true);
      setAvalancheError(null);

      const avalancheLeaderboardData: UnifiedLeaderboardEntry[] = [];

      // Process avalanche jumps data
      if (avalancheJumpsLeaderboardData && Array.isArray(avalancheJumpsLeaderboardData)) {
        avalancheJumpsLeaderboardData.forEach(
          (entry: {
            user: `0x${string}`;
            totalScore: bigint;
            bestSingleScore: bigint;
            submissionCount: bigint;
            lastSubmissionTime: bigint;
          }) => {
            avalancheLeaderboardData.push({
              user: entry.user,
              chain: "avalanche",
              pullups: 0,
              jumps: Number(entry.totalScore),
              totalScore: Number(entry.totalScore),
              submissionCount: Number(entry.submissionCount), // Convert to number
              lastSubmissionTime: Number(entry.lastSubmissionTime),
            });
          }
        );
      }

      // Process avalanche pullups data and merge with existing entries
      if (avalanchePullupsLeaderboardData && Array.isArray(avalanchePullupsLeaderboardData)) {
        avalanchePullupsLeaderboardData.forEach(
          (entry: {
            user: `0x${string}`;
            totalScore: bigint;
            bestSingleScore: bigint;
            submissionCount: bigint;
            lastSubmissionTime: bigint;
          }) => {
            // Find if user already exists in the array
            const existingIndex = avalancheLeaderboardData.findIndex(user => user.user === entry.user);
            if (existingIndex !== -1) {
              // Update existing entry
              avalancheLeaderboardData[existingIndex].pullups = Number(entry.totalScore);
              avalancheLeaderboardData[existingIndex].totalScore += Number(entry.totalScore);
              avalancheLeaderboardData[existingIndex].lastSubmissionTime = Math.max(
                avalancheLeaderboardData[existingIndex].lastSubmissionTime,
                Number(entry.lastSubmissionTime)
              );
            } else {
              // Add new entry
              avalancheLeaderboardData.push({
                user: entry.user,
                chain: "avalanche",
                pullups: Number(entry.totalScore),
                jumps: 0,
                totalScore: Number(entry.totalScore),
                submissionCount: Number(entry.submissionCount), // Convert to number
                lastSubmissionTime: Number(entry.lastSubmissionTime),
              });
            }
          }
        );
      }

      setAvalancheLeaderboard(avalancheLeaderboardData);
      setIsAvalancheLoading(false);
    } catch (error) {
      console.error("Error fetching Avalanche leaderboard:", error);
      setAvalancheError(error instanceof Error ? error.message : "Failed to fetch Avalanche leaderboard");
      setIsAvalancheLoading(false);
    }
  }, [avalancheJumpsLeaderboardData, avalanchePullupsLeaderboardData, enabled, chain, limit]);

  // Fetch Solana and Avalanche leaderboards when enabled or chain filter changes
  useEffect(() => {
    fetchSolanaLeaderboard();
    fetchAvalancheLeaderboard();
  }, [fetchSolanaLeaderboard, fetchAvalancheLeaderboard]);

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

    // Add Avalanche leaderboard
    if (chain === "all" || chain === "avalanche") {
      combined.push(...avalancheLeaderboard);
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
  }, [jumpsLeaderboardData, pullupsLeaderboardData, solanaLeaderboard, avalancheLeaderboard, chain]);

  return {
    leaderboard,
    isLoading: isJumpsLoading || isPullupsLoading || isSolanaLoading || isAvalancheLoading,
    error: jumpsError?.message || pullupsError?.message || solanaError || avalancheError,
    refetch: async () => {
      await Promise.all([
        refetchJumpsLeaderboard(),
        refetchPullupsLeaderboard()
      ]);
      await Promise.all([
        refetchAvalancheJumpsLeaderboard(),
        refetchAvalanchePullupsLeaderboard()
      ]);
      await fetchSolanaLeaderboard();
    },
  };
}
