import { useReadContract } from "wagmi";
import { useMemo } from "react";
import {
  getContractConfig,
  JUMPS_LEADERBOARD_CONFIG,
  PULLUPS_LEADERBOARD_CONFIG,
} from "@/lib/contracts";
import type { Hex } from "viem";

export interface BlockchainScore {
  user: string;
  pullups: number;
  jumps: number;
  timestamp: number;
}

export const useBlockchainContracts = (address?: string) => {
  // Get leaderboard data from jumps exercise leaderboard
  const {
    data: jumpsLeaderboardData,
    isLoading: isJumpsLoading,
    error: jumpsError,
    status: jumpsStatus,
    refetch: refetchJumpsLeaderboard,
    dataUpdatedAt: jumpsUpdatedAt,
  } = useReadContract({
    address: JUMPS_LEADERBOARD_CONFIG.address as Hex,
    abi: JUMPS_LEADERBOARD_CONFIG.abi,
    functionName: "getTopUsers",
    args: [10], // Get top 10 users
    chainId: 84532, // Explicitly specify Base Sepolia
    query: {
      enabled: true, // Enable now that leaderboards are deployed
      staleTime: 60000, // 1 minute - data stays fresh longer
      gcTime: 300000, // 5 minutes - keep in cache
      refetchOnWindowFocus: false, // Prevent auto-refresh on focus
      refetchInterval: false, // Disable auto-refresh
    },
  });

  // Get leaderboard data from pullups exercise leaderboard
  const {
    data: pullupsLeaderboardData,
    isLoading: isPullupsLoading,
    error: pullupsError,
    status: pullupsStatus,
    refetch: refetchPullupsLeaderboard,
    dataUpdatedAt: pullupsUpdatedAt,
  } = useReadContract({
    address: PULLUPS_LEADERBOARD_CONFIG.address as Hex,
    abi: PULLUPS_LEADERBOARD_CONFIG.abi,
    functionName: "getTopUsers",
    args: [10], // Get top 10 users
    chainId: 84532, // Explicitly specify Base Sepolia
    query: {
      enabled: true, // Enable now that leaderboards are deployed
      staleTime: 60000, // 1 minute - data stays fresh longer
      gcTime: 300000, // 5 minutes - keep in cache
      refetchOnWindowFocus: false, // Prevent auto-refresh on focus
      refetchInterval: false, // Disable auto-refresh
    },
  });

  // Get contract configuration for cooldown check
  const contractConfig = useMemo(() => {
    return getContractConfig("jumps");
  }, []);

  // Get cooldown status for current user
  const {
    data: cooldownData,
    isLoading: isCooldownLoading,
    error: cooldownError,
    status: cooldownStatus,
    refetch: refetchCooldown,
    dataUpdatedAt: cooldownUpdatedAt,
  } = useReadContract({
    address: contractConfig.address as Hex,
    abi: contractConfig.abi,
    functionName: "getTimeUntilNextSubmission",
    args: address ? [address] : undefined,
    chainId: 84532, // Explicitly specify Base Sepolia
    query: {
      enabled: !!address,
      staleTime: 30000, // 30 seconds for cooldown
      gcTime: 60000, // 1 minute cache
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  });

  // Process combined leaderboard data from both exercise leaderboards
  const leaderboard = useMemo((): BlockchainScore[] => {
    console.log("🏆 Processing combined leaderboard data:", {
      jumpsData: jumpsLeaderboardData,
      pullupsData: pullupsLeaderboardData,
    });

    if (!jumpsLeaderboardData && !pullupsLeaderboardData) return [];

    // Convert data to a more usable format and combine by user
    const userScores = new Map<string, BlockchainScore>();

    // Process jumps data
    if (jumpsLeaderboardData) {
      (jumpsLeaderboardData as any[]).forEach((entry: any) => {
        const userAddress = entry.user || entry[0];
        const score = Number(entry.score || entry[1] || 0);
        const timestamp = Number(entry.timestamp || entry[2] || Date.now());

        if (userAddress && score > 0) {
          const existing = userScores.get(userAddress) || {
            user: userAddress,
            pullups: 0,
            jumps: 0,
            timestamp: 0,
          };
          userScores.set(userAddress, {
            ...existing,
            jumps: score,
            timestamp: Math.max(existing.timestamp, timestamp),
          });
        }
      });
    }

    // Process pullups data
    if (pullupsLeaderboardData) {
      (pullupsLeaderboardData as any[]).forEach((entry: any) => {
        const userAddress = entry.user || entry[0];
        const score = Number(entry.score || entry[1] || 0);
        const timestamp = Number(entry.timestamp || entry[2] || Date.now());

        if (userAddress && score > 0) {
          const existing = userScores.get(userAddress) || {
            user: userAddress,
            pullups: 0,
            jumps: 0,
            timestamp: 0,
          };
          userScores.set(userAddress, {
            ...existing,
            pullups: score,
            timestamp: Math.max(existing.timestamp, timestamp),
          });
        }
      });
    }

    const result = Array.from(userScores.values())
      .filter((entry) => entry.pullups > 0 || entry.jumps > 0)
      .sort((a, b) => (b.pullups + b.jumps) - (a.pullups + a.jumps));

    console.log("✅ Processed combined leaderboard:", result);
    return result;
  }, [jumpsLeaderboardData, pullupsLeaderboardData]);

  return {
    // Data
    leaderboard,
    cooldownData,
    
    // Loading states
    isJumpsLoading,
    isPullupsLoading,
    isCooldownLoading,
    
    // Errors
    jumpsError,
    pullupsError,
    cooldownError,
    
    // Status
    jumpsStatus,
    pullupsStatus,
    cooldownStatus,
    
    // Refetch functions
    refetchJumpsLeaderboard,
    refetchPullupsLeaderboard,
    refetchCooldown,
    
    // Updated timestamps
    jumpsUpdatedAt,
    pullupsUpdatedAt,
    cooldownUpdatedAt,
  };
};