import { useContext } from "react";
import { UserContext } from "@/contexts/UserContext";

const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

// Convenience hooks for specific use cases
export const useUserAuth = () => {
  const {
    isConnected,
    isAuthenticated,
    address,
    isLoading,
    error,
    connectWallet,
    signInWithEthereum,
    signOut,
    connectAndSignIn,
    resetAuth,
  } = useUser();

  return {
    isConnected,
    isAuthenticated,
    address,
    isLoading,
    error,
    connectWallet,
    signInWithEthereum,
    signOut,
    connectAndSignIn,
    resetAuth,
  };
};

export const useUserBlockchain = () => {
  const {
    leaderboard,
    isLeaderboardLoading,
    canSubmit,
    timeUntilNextSubmission,
    isSubmitting,
    lastRefresh,
    isRefreshing,
    dataStale,
    staleness,
    pendingUpdates,
    lastUserRefresh,
    currentTxHash,
    submitScore,
    refreshLeaderboard,
    switchToBaseSepolia,
    hasSubmittedScore,
  } = useUser();

  return {
    leaderboard,
    isLoading: isLeaderboardLoading,
    canSubmit,
    timeUntilNextSubmission,
    isSubmitting,
    lastRefresh,
    isRefreshing,
    dataStale,
    staleness,
    pendingUpdates,
    lastUserRefresh,
    currentTxHash,
    submitScore,
    refetch: refreshLeaderboard,
    switchToBaseSepolia,
    hasSubmittedScore,
  };
};

export const useUserDisplay = () => {
  const {
    address,
    basename,
    isBasenameLoading,
    getDisplayName,
    copyAddress,
    displayName,
  } = useUser();

  return {
    address,
    basename,
    isBasenameLoading,
    displayName,
    getDisplayName,
    copyAddress,
  };
};

export { useUser };
