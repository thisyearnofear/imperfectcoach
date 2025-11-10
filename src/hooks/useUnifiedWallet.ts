// Unified Wallet Hook - Combines Base and Solana wallet states
// Provides single interface for multi-chain wallet management

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { solanaWalletManager } from '../lib/payments/solana-wallet-adapter';

export type WalletChain = 'base' | 'solana';

export interface UnifiedWalletState {
  // Base wallet (via wagmi)
  baseWallet: {
    connected: boolean;
    address: string | null;
  };
  
  // Solana wallet (via phantom)
  solanaWallet: {
    connected: boolean;
    address: string | null;
    connecting: boolean;
  };
  
  // Combined state
  hasAnyWallet: boolean;
  hasBothWallets: boolean;
  activeChain: WalletChain | null;
  smartRoutingAvailable: boolean;
}

export function useUnifiedWallet() {
  const { address: baseAddress, isConnected: baseConnected } = useAccount();
  
  const [solanaState, setSolanaState] = useState({
    connected: false,
    address: null as string | null,
    connecting: false
  });

  // Monitor Solana wallet state
  useEffect(() => {
    const updateSolanaState = () => {
      const state = solanaWalletManager.getState();
      setSolanaState({
        connected: state.connected,
        address: state.publicKey?.toString() || null,
        connecting: state.connecting
      });
    };

    updateSolanaState();
    const interval = setInterval(updateSolanaState, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute unified state
  const unifiedState: UnifiedWalletState = {
    baseWallet: {
      connected: baseConnected,
      address: baseAddress || null
    },
    solanaWallet: solanaState,
    hasAnyWallet: baseConnected || solanaState.connected,
    hasBothWallets: baseConnected && solanaState.connected,
    activeChain: solanaState.connected ? 'solana' : baseConnected ? 'base' : null,
    smartRoutingAvailable: baseConnected && solanaState.connected
  };

  // Wallet management functions
  const connectSolana = async () => {
    try {
      await solanaWalletManager.connect('phantom');
    } catch (error) {
      console.error('Solana connection failed:', error);
      throw error;
    }
  };

  const disconnectSolana = async () => {
    try {
      await solanaWalletManager.disconnect();
    } catch (error) {
      console.error('Solana disconnect failed:', error);
      throw error;
    }
  };

  const getActiveAddress = (): string | null => {
    if (unifiedState.activeChain === 'solana') {
      return solanaState.address;
    }
    return baseAddress || null;
  };

  const getAddressForChain = (chain: WalletChain): string | null => {
    return chain === 'solana' ? solanaState.address : baseAddress || null;
  };

  const isChainConnected = (chain: WalletChain): boolean => {
    return chain === 'solana' ? solanaState.connected : baseConnected;
  };

  return {
    ...unifiedState,
    
    // Functions
    connectSolana,
    disconnectSolana,
    getActiveAddress,
    getAddressForChain,
    isChainConnected,
    
    // Utility
    formatAddress: (address: string, chain: WalletChain) => {
      const length = chain === 'solana' ? 8 : 10;
      const start = chain === 'solana' ? 4 : 6;
      const end = 4;
      return `${address.slice(0, start)}...${address.slice(-end)}`;
    }
  };
}