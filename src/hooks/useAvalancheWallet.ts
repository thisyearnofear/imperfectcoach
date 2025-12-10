import { useCallback } from "react";
import { useEVMWallet } from "./useEVMWallet";
import { avalancheFuji } from "wagmi/chains";

/**
 * Avalanche C-Chain (Fuji testnet) wallet integration
 * Single source of truth for Avalanche EVM wallet logic
 */
export const useAvalancheWallet = () => {
  const evmWallet = useEVMWallet({ defaultChain: avalancheFuji, autoSignIn: true });

  const switchToAvalancheFuji = useCallback(async () => {
    await evmWallet.switchToChain(avalancheFuji);
  }, [evmWallet]);

  return {
    // State
    address: evmWallet.address,
    isConnected: evmWallet.isConnected,
    isAuthenticated: evmWallet.isAuthenticated,
    isLoading: evmWallet.isLoading,
    error: evmWallet.error,
    copied: evmWallet.copied,
    authState: evmWallet.authState,
    chainId: evmWallet.chainId,

    // Actions
    connectWallet: evmWallet.connectWallet,
    disconnectWallet: evmWallet.disconnectWallet,
    signIn: evmWallet.signIn,
    switchToAvalancheFuji,
    getDisplayName: evmWallet.getDisplayName,
    copyAddress: evmWallet.copyAddress,
  };
};
