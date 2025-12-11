/**
 * EVMWalletConnector - Standalone RainbowKit integration for EVM wallet auth path
 * Allows users to connect any EVM wallet (MetaMask, WalletConnect, etc.)
 * and choose between Base Sepolia or Avalanche Fuji
 */

import React, { useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, ConnectButton, useChainModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient } from '@tanstack/react-query';
import { rainbowkitConfig } from '@/wagmi';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

const queryClient = new QueryClient();

interface EVMWalletConnectorProps {
  onConnected?: (address: string, chainId: number) => void;
  onChainChanged?: (chainId: number) => void;
}

/**
 * Inner component that uses RainbowKit hooks
 * Must be inside RainbowKitProvider
 */
const EVMWalletContent = ({ onConnected, onChainChanged }: EVMWalletConnectorProps) => {
  const { address, isConnected, chainId } = useAccount();
  const { openChainModal } = useChainModal();

  useEffect(() => {
    if (isConnected && address) {
      onConnected?.(address, chainId || 0);
    }
  }, [isConnected, address, chainId, onConnected]);

  useEffect(() => {
    if (chainId) {
      onChainChanged?.(chainId);
    }
  }, [chainId, onChainChanged]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <ConnectButton />
        
        {isConnected && (
          <Button
            onClick={openChainModal}
            variant="outline"
            className="w-full"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Switch Network
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * EVMWalletConnector - Wraps RainbowKit provider with wagmi config
 * Use this component in the auth flow when user selects "EVM Wallet"
 */
export const EVMWalletConnector = React.forwardRef<
  HTMLDivElement,
  EVMWalletConnectorProps
>(({ onConnected, onChainChanged }, ref) => {
  return (
    <div ref={ref} className="w-full">
      <WagmiProvider config={rainbowkitConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme="light"
            modalSize="compact"
            showRecentTransactions={false}
          >
            <EVMWalletContent 
              onConnected={onConnected}
              onChainChanged={onChainChanged}
            />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  );
});

EVMWalletConnector.displayName = 'EVMWalletConnector';

export default EVMWalletConnector;
