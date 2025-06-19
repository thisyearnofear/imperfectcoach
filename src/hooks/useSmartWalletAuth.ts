import { useCallback, useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { cbWalletConnector } from '@/wagmi';
import { toast } from 'sonner';
import type { Hex } from 'viem';

interface SmartWalletAuthState {
  isConnected: boolean;
  isAuthenticated: boolean;
  address?: string;
  isLoading: boolean;
  error?: string;
}

export const useSmartWalletAuth = () => {
  const [authState, setAuthState] = useState<SmartWalletAuthState>({
    isConnected: false,
    isAuthenticated: false,
    isLoading: false,
  });

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessage } = useSignMessage();

  // Check if user is authenticated using SIWE
  useEffect(() => {
    const checkAuth = () => {
      const siweAuth = localStorage.getItem('siwe-auth');
      if (siweAuth && isConnected && address) {
        try {
          const authData = JSON.parse(siweAuth);
          const isValid =
            authData.address === address &&
            authData.expiresAt > Date.now() &&
            authData.domain === window.location.host;

          if (isValid) {
            setAuthState(prev => ({
              ...prev,
              isConnected,
              isAuthenticated: true,
              address,
              isLoading: false,
            }));
            console.log('✅ Valid SIWE authentication found');
            return;
          }
        } catch (error) {
          console.error('Error parsing SIWE auth:', error);
          localStorage.removeItem('siwe-auth');
        }
      }

      // No valid auth found
      setAuthState(prev => ({
        ...prev,
        isConnected,
        isAuthenticated: false,
        address,
        isLoading: false,
      }));
    };

    checkAuth();
  }, [isConnected, address]);

  const connectWallet = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));

      connect({
        connector: cbWalletConnector,
      });

    } catch (error) {
      console.error('Error connecting wallet:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to connect wallet'
      }));
      toast.error('Failed to connect wallet');
    }
  }, [connect]);

  const signInWithEthereum = useCallback(async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));

      // Generate nonce (in production, fetch from your backend)
      const nonce = Math.random().toString(36).substring(2, 15);

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Imperfect Coach with your Smart Wallet',
        uri: window.location.origin,
        version: '1',
        chainId: 84532, // Base Sepolia
        nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      });

      console.log('📝 SIWE message created:', message.prepareMessage());

      signMessage(
        { message: message.prepareMessage() },
        {
          onSuccess: (signature: Hex) => {
            console.log('✅ SIWE signature successful:', signature);

            // Store SIWE authentication data
            const authData = {
              address,
              signature,
              message: message.prepareMessage(),
              domain: window.location.host,
              nonce,
              timestamp: Date.now(),
              expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            };

            localStorage.setItem('siwe-auth', JSON.stringify(authData));
            console.log('💾 SIWE auth data stored');

            setAuthState(prev => ({
              ...prev,
              isAuthenticated: true,
              isLoading: false,
            }));

            toast.success('Successfully signed in with Smart Wallet!');
          },
          onError: (error) => {
            console.error('❌ Error signing SIWE message:', error);

            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: `Failed to sign message: ${error.message}`
            }));

            toast.error(`Failed to sign message: ${error.message}`);
          },
        }
      );

    } catch (error) {
      console.error('Error in SIWE flow:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Authentication failed'
      }));
      toast.error('Authentication failed');
    }
  }, [address, signMessage]);

  const signOut = useCallback(() => {
    localStorage.removeItem('siwe-auth');
    disconnect();
    setAuthState({
      isConnected: false,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.success('Signed out successfully');
  }, [disconnect]);

  const connectAndSignIn = useCallback(async () => {
    if (!isConnected) {
      await connectWallet();
      // The useEffect will handle auto-signing after connection
    } else if (!authState.isAuthenticated) {
      await signInWithEthereum();
    }
  }, [isConnected, authState.isAuthenticated, connectWallet, signInWithEthereum]);

  // Auto-sign after successful connection
  useEffect(() => {
    if (isConnected && address && !authState.isAuthenticated && !authState.isLoading) {
      // Small delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        signInWithEthereum();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isConnected, address, authState.isAuthenticated, authState.isLoading, signInWithEthereum]);

  return {
    ...authState,
    connectWallet,
    signInWithEthereum,
    signOut,
    connectAndSignIn,
  };
};
