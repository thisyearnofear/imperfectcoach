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
  isSolanaLoading: boolean; // Alias for isSolanaConnecting
  solanaAddress: string | null; // Alias for solanaPublicKey as string
  solanaPublicKey: any;
  connection: any; // For Solana connection

  // Blockchain state
  leaderboard: BlockchainScore[];
  isLeaderboardLoading: boolean;
  cooldownData?: any;
  combinedLeaderboard: any[];
  isCombinedLeaderboardLoading: boolean;
  combinedLeaderboardError?: string;

  // Submission state
  canSubmit: boolean;
  timeUntilNextSubmission: number;
  isSubmitting: boolean; // Alias for isSubmittingScore
  currentTxHash?: string;
  hasSubmittedScore: boolean;

  // UI state
  displayName: string;
  basename?: string;
  isBasenameLoading: boolean;

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
  lastRefresh: Date | null;
  dataStale: boolean;
  staleness: number; // Also in refreshState
  pendingUpdates: boolean; // Also in refreshState
  lastUserRefresh: Date | null; // Also in refreshState
}

export interface UserActions {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signOut: () => Promise<void>; // Alias for disconnectWallet for compatibility
  signIn: () => Promise<void>;
  signInWithEthereum: () => Promise<void>; // Alias for signIn
  connectAndSignIn: () => Promise<void>;
  resetAuth: () => Promise<void>; // Alias for disconnectWallet
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
    isSolanaLoading: solanaWallet.isSolanaConnecting, // Alias
    solanaAddress: solanaWallet.solanaPublicKey?.toString() || null, // String version
    solanaPublicKey: solanaWallet.solanaPublicKey,
    connection: solanaWallet.connection,

    // Blockchain state
    leaderboard: contracts.leaderboard,
    isLeaderboardLoading: contracts.isJumpsLoading || contracts.isPullupsLoading,
    cooldownData: contracts.cooldownData,
    combinedLeaderboard,
    isCombinedLeaderboardLoading,
    combinedLeaderboardError,

    // Submission state
    canSubmit: (contracts.cooldownData as any)?.canSubmit || false,
    timeUntilNextSubmission: (contracts.cooldownData as any)?.timeUntilNextSubmission || 0,
    isSubmitting: scoreSubmission.isSubmittingScore, // Alias
    currentTxHash: scoreSubmission.lastHash, // Use lastHash as currentTxHash
    hasSubmittedScore: (contracts.cooldownData as any)?.hasSubmitted || false,

    // UI state
    displayName,
    basename,
    isBasenameLoading: basename === undefined, // Simple heuristic

    // Submission state
    isSubmittingScore: scoreSubmission.isSubmittingScore,
    submitError: scoreSubmission.submitError,

    // Refresh state
    refreshState,
    lastRefresh: refreshState.lastUserRefresh,
    dataStale: refreshState.staleness > 300000, // 5 minutes
    staleness: refreshState.staleness,
    pendingUpdates: refreshState.pendingUpdates,
    lastUserRefresh: refreshState.lastUserRefresh,
  };

  // Alias functions for compatibility with existing components
  const signOut = useCallback(async () => {
    await baseWallet.disconnectWallet();
  }, [baseWallet.disconnectWallet]);

  const signInWithEthereum = useCallback(async () => {
    // Add a small delay to ensure wallet state is properly updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Add defensive checks
    if (!baseWallet.isConnected) {
      console.error("Cannot sign in with Ethereum: Wallet not connected");
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!baseWallet.address) {
      console.error("Cannot sign in with Ethereum: No address available");
      toast.error("Wallet connected but no address available");
      return;
    }
    
    await baseWallet.signIn();
  }, [baseWallet]);

  const connectAndSignIn = useCallback(async () => {
    try {
      await baseWallet.connectWallet();
      
      // Wait for connection to be fully established
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds max wait
      
      while (!baseWallet.isConnected && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (!baseWallet.isConnected) {
        throw new Error("Wallet connection timeout");
      }
      
      // Wait a bit more for the address to be available
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!baseWallet.address) {
        throw new Error("Wallet connected but address not available");
      }
      
      // Now sign in
      await baseWallet.signIn();
    } catch (error) {
      console.error("Connect and sign in error:", error);
      toast.error("Failed to connect and sign in: " + (error as Error).message);
    }
  }, [baseWallet]);

  const resetAuth = useCallback(async () => {
    await baseWallet.disconnectWallet();
  }, [baseWallet.disconnectWallet]);

  const actions: UserActions = {
    connectWallet: baseWallet.connectWallet,
    disconnectWallet: baseWallet.disconnectWallet,
    signOut,
    signIn: baseWallet.signIn,
    signInWithEthereum,
    connectAndSignIn,
    resetAuth,
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