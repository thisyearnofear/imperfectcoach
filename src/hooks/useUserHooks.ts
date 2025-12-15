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
    // Base (EVM)
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
    // Solana
    solanaAddress,
    isSolanaConnected,
    isSolanaLoading,
    connectSolanaWallet,
    disconnectSolanaWallet,
    // Preferences
    preferredChain,
    setPreferredChain,
  } = useUser();

  return {
    // Base (EVM)
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
    // Solana
    solanaAddress,
    isSolanaConnected,
    isSolanaLoading,
    connectSolanaWallet,
    disconnectSolanaWallet,
    // Preferences
    preferredChain,
    setPreferredChain,
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
    dataStale,
    staleness,
    pendingUpdates,
    lastUserRefresh,
    currentTxHash,
    submitScore,
    refreshLeaderboard,
    switchToChain,
    hasSubmittedScore,
    // Preferences
    preferredChain,
    setPreferredChain,
  } = useUser();

  return {
    leaderboard,
    isLoading: isLeaderboardLoading,
    canSubmit,
    timeUntilNextSubmission,
    isSubmitting,
    lastRefresh,
    dataStale,
    staleness,
    pendingUpdates,
    lastUserRefresh,
    currentTxHash,
    submitScore,
    refetch: refreshLeaderboard,
    switchToChain,
    hasSubmittedScore,
    // Preferences
    preferredChain,
    setPreferredChain,
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
