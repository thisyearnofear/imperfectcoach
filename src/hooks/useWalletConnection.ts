/**
 * Consolidated wallet connection hook
 * Single source of truth for multi-chain wallet state (EVM + Solana)
 * Replaces: useSolanaWallet, useEVMWallet context usage
 */

import { useUser } from "./useUserHooks";

export interface WalletConnectionState {
  // EVM (Base, Avalanche)
  evmAddress: string | null;
  isEVMConnected: boolean;
  isEVMAuthenticated: boolean;
  currentChain?: string; // "Base Sepolia" or "Avalanche Fuji"
  
  // Solana
  solanaAddress: string | null;
  isSolanaConnected: boolean;
  
  // Combined
  hasAnyWallet: boolean;
  primaryChain: "evm" | "solana" | null;
}

export interface WalletConnectionActions {
  connectEVM: (chain?: "base" | "avalanche") => Promise<void>;
  connectSolana: () => Promise<void>;
  disconnectEVM: () => Promise<void>;
  disconnectSolana: () => Promise<void>;
  switchChain: (chain: "base" | "avalanche") => Promise<void>;
  getActiveAddress: () => string | null;
}

/**
 * Hook that consolidates EVM and Solana wallet state
 * Used by components that need wallet connection info
 */
export function useWalletConnection(): WalletConnectionState & WalletConnectionActions {
  const {
    address,
    isConnected,
    isAuthenticated,
    chainName,
    solanaAddress,
    isSolanaConnected,
    connectAndSignIn,
    switchToChain,
    connectSolanaWallet,
    disconnectSolanaWallet,
    disconnectWallet,
  } = useUser();

  // Debug wallet connection state
  if (process.env.NODE_ENV === "development") {
    console.log("🔌 useWalletConnection state:", {
      evmAddress: address,
      isConnected,
      solanaAddress,
      isSolanaConnected,
      hasAnyWallet: isConnected || isSolanaConnected,
    });
  }

  const state: WalletConnectionState = {
    evmAddress: address || null,
    isEVMConnected: isConnected,
    isEVMAuthenticated: isAuthenticated,
    currentChain: chainName,
    solanaAddress: solanaAddress || null,
    isSolanaConnected: isSolanaConnected,
    hasAnyWallet: isConnected || isSolanaConnected,
    primaryChain: isSolanaConnected ? "solana" : isConnected ? "evm" : null,
  };

  const actions: WalletConnectionActions = {
    connectEVM: async (chain = "base") => {
      try {
        await connectAndSignIn();
        if (chain === "avalanche") {
          await switchToChain("avalanche");
        }
      } catch (error) {
        console.error("EVM connection failed:", error);
        throw error;
      }
    },

    connectSolana: async () => {
      try {
        await connectSolanaWallet();
      } catch (error) {
        console.error("Solana connection failed:", error);
        throw error;
      }
    },

    disconnectEVM: async () => {
      try {
        await disconnectWallet();
      } catch (error) {
        console.error("EVM disconnect failed:", error);
        throw error;
      }
    },

    disconnectSolana: async () => {
      try {
        await disconnectSolanaWallet();
      } catch (error) {
        console.error("Solana disconnect failed:", error);
        throw error;
      }
    },

    switchChain: async (chain: "base" | "avalanche") => {
      try {
        await switchToChain(chain);
      } catch (error) {
        console.error("Chain switch failed:", error);
        throw error;
      }
    },

    getActiveAddress: () => {
      return isSolanaConnected ? solanaAddress : address || null;
    },
  };

  return {
    ...state,
    ...actions,
  };
}
