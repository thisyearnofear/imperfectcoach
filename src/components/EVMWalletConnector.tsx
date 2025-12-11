/**
 * EVMWalletConnector - Standalone RainbowKit integration for EVM wallet auth path
 * Allows users to connect any EVM wallet (MetaMask, WalletConnect, etc.)
 * and choose between Base Sepolia or Avalanche Fuji
 */

import React, { useEffect } from 'react';
import { ConnectButton, useChainModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface EVMWalletConnectorProps {
  onConnected?: (address: string, chainId: number) => void;
  onChainChanged?: (chainId: number) => void;
}

/**
 * EVMWalletConnector - Wraps RainbowKit ConnectButton
 * Use this component in the auth flow when user selects "EVM Wallet"
 */
export const EVMWalletConnector = React.forwardRef<
  HTMLDivElement,
  EVMWalletConnectorProps
>(({ onConnected, onChainChanged }, ref) => {
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
    <div ref={ref} className="w-full">
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex justify-center">
            <ConnectButton />
          </div>

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
    </div>
  );
});

EVMWalletConnector.displayName = 'EVMWalletConnector';

export default EVMWalletConnector;
