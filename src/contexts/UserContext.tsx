import React, { createContext, useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useBasename } from "@/hooks/useBasename";
import { getCDPStatus } from "@/lib/cdp";
import { useBaseWallet } from "@/hooks/useBaseWallet";
import { useSolanaWalletAdapter } from "@/hooks/useSolanaWalletAdapter";
import { useBlockchainContracts } from "@/hooks/useBlockchainContracts";
import { useScoreSubmission } from "@/hooks/useScoreSubmission";
import { useLeaderboardParallel } from "@/hooks/useLeaderboardParallel";
import type { BlockchainScore } from "@/hooks/useBlockchainContracts";

export interface UserState {
  // Auth state - Base (EVM)
  isConnected: boolean;
  isAuthenticated: boolean;
  address?: string;
  isLoading: boolean;
  error?: string;
  copied: boolean;

  // Solana wallet state
  isSolanaConnected: boolean;
  isSolanaConnecting: boolean;
  solanaPublicKey?: any;

  // Blockchain state
  leaderboard: BlockchainScore[];
  isLeaderboardLoading: boolean;
  cooldownData?: any;
  combinedLeaderboard: any[];
  isCombinedLeaderboardLoading: boolean;
  combinedLeaderboardError?: string;

  // UI state
  displayName: string;

  // Submission state
  isSubmittingScore: boolean;
  submitError?: string;

  // Refresh state
  refreshState: {
    isRefreshing: boolean;
    lastUserRefresh: Date | null;
    staleness: number;
    pendingUpdates: boolean;
  };
}

export interface UserActions {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signIn: () => Promise<void>;
  connectSolanaWallet: () => Promise<void>;
  disconnectSolanaWallet: () => Promise<void>;
  submitScore: (pullups: number, jumps: number) => Promise<{ hash?: string }>;
  refreshLeaderboard: () => Promise<void>;
  getDisplayName: () => string;
  copyAddress: () => Promise<void>;
  getCDPFeatures: () => any;
  switchToBaseSepolia: () => Promise<void>;
}

export interface UserContextType extends UserState, UserActions {}

export const UserContext = createContext<UserContextType | null>(null);

interface UserProviderOptions {
  requireSiwe?: boolean;
  enableSmartRefresh?: boolean;
}

interface UserProviderProps {
  children: React.ReactNode;
  options?: UserProviderOptions;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children, options = {} }) => {
  // Initialize all modular hooks
  const baseWallet = useBaseWallet();
  const solanaWallet = useSolanaWalletAdapter();
  const contracts = useBlockchainContracts(baseWallet.address);
  const { basename } = useBasename(baseWallet.address);
  
  // Combined leaderboard from both chains
  const { 
    leaderboard: combinedLeaderboard, 
    isLoading: isCombinedLeaderboardLoading,
    error: combinedLeaderboardError,
    refetch: refreshSolanaLeaderboard 
  } = useLeaderboardParallel();
  
  // Refresh state management
  const [refreshState, setRefreshState] = useState({
    isRefreshing: false,
    lastUserRefresh: null as Date | null,
    staleness: 0,
    pendingUpdates: false,
  });

  // Leaderboard refresh function
  const refreshLeaderboard = useCallback(async () => {
    if (refreshState.isRefreshing) return;

    try {
      setRefreshState((prev) => ({ ...prev, isRefreshing: true }));

      await Promise.all([
        contracts.refetchJumpsLeaderboard(),
        contracts.refetchPullupsLeaderboard(),
        contracts.refetchCooldown(),
        refreshSolanaLeaderboard(),
      ]);

      setRefreshState((prev) => ({
        ...prev,
        isRefreshing: false,
        lastUserRefresh: new Date(),
        staleness: 0,
        pendingUpdates: false,
      }));

      toast.success("Leaderboard refreshed!");
    } catch (error) {
      setRefreshState((prev) => ({ ...prev, isRefreshing: false }));
      toast.error("Failed to refresh leaderboard");
    }
  }, [
    contracts.refetchJumpsLeaderboard,
    contracts.refetchPullupsLeaderboard,
    contracts.refetchCooldown,
    refreshSolanaLeaderboard,
    refreshState.isRefreshing,
  ]);

  // Score submission with refresh
  const scoreSubmission = useScoreSubmission(
    baseWallet.isConnected,
    baseWallet.address,
    solanaWallet.isSolanaConnected,
    solanaWallet.solanaPublicKey,
    solanaWallet.connection,
    refreshLeaderboard
  );

  // CDP features
  const getCDPFeatures = useCallback(() => {
    return getCDPStatus();
  }, []);

  // Display name with basename support
  const displayName = useMemo(() => {
    if (basename) return basename;
    return baseWallet.getDisplayName();
  }, [basename, baseWallet.getDisplayName]);

  // Combined state
  const state: UserState = {
    // Base wallet state
    isConnected: baseWallet.isConnected,
    isAuthenticated: baseWallet.isAuthenticated,
    address: baseWallet.address,
    isLoading: baseWallet.isLoading,
    error: baseWallet.error,
    copied: baseWallet.copied,

    // Solana wallet state
    isSolanaConnected: solanaWallet.isSolanaConnected,
    isSolanaConnecting: solanaWallet.isSolanaConnecting,
    solanaPublicKey: solanaWallet.solanaPublicKey,

    // Blockchain state
    leaderboard: contracts.leaderboard,
    isLeaderboardLoading: contracts.isJumpsLoading || contracts.isPullupsLoading,
    cooldownData: contracts.cooldownData,
    combinedLeaderboard,
    isCombinedLeaderboardLoading,
    combinedLeaderboardError,

    // UI state
    displayName,

    // Submission state
    isSubmittingScore: scoreSubmission.isSubmittingScore,
    submitError: scoreSubmission.submitError,

    // Refresh state
    refreshState,
  };

  const actions: UserActions = {
    connectWallet: baseWallet.connectWallet,
    disconnectWallet: baseWallet.disconnectWallet,
    signIn: baseWallet.signIn,
    connectSolanaWallet: solanaWallet.connectSolanaWallet,
    disconnectSolanaWallet: solanaWallet.disconnectSolanaWallet,
    submitScore: scoreSubmission.submitScore,
    refreshLeaderboard,
    getDisplayName: baseWallet.getDisplayName,
    copyAddress: baseWallet.copyAddress,
    getCDPFeatures,
    switchToBaseSepolia: baseWallet.switchToBaseSepolia,
  };

  const contextValue: UserContextType = {
    ...state,
    ...actions,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};