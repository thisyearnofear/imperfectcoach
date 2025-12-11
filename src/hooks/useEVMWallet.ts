import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain } from "wagmi";
import { useCallback, useState, useEffect, useRef } from "react";
import { SiweMessage } from "siwe";
import { toast } from "sonner";
import { baseSepolia, avalancheFuji, Chain } from "wagmi/chains";

interface AuthState {
  isAuthenticated: boolean;
  message?: string;
  signature?: string;
}

interface UseEVMWalletOptions {
  defaultChain?: Chain;
  autoSignIn?: boolean;
}

/**
 * Unified EVM wallet hook for multi-chain support (Base, Avalanche, etc.)
 * Encapsulates all EVM-wallet-specific logic: connection, disconnection, SIWE
 * Single source of truth for EVM authentication flows
 */
export const useEVMWallet = (options: UseEVMWalletOptions = {}) => {
  const { defaultChain = baseSepolia, autoSignIn = true } = options;
  
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessage, data: signatureData } = useSignMessage();
  const { switchChain } = useSwitchChain();

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const hasTriggeredAutoSignIn = useRef(false);

  // Track signature data changes
  useEffect(() => {
    if (signatureData) {
      setAuthState(prev => ({
        ...prev,
        signature: signatureData,
        isAuthenticated: true,
      }));
      toast.success("Successfully signed in!");
    }
  }, [signatureData]);

  const connectWallet = useCallback(async (connectorName?: string) => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      const connector = connectorName 
        ? connectors.find(c => c.name === connectorName)
        : connectors[0];
      
      if (!connector) {
        throw new Error("No wallet connector available");
      }
      
      await connect({ connector });
      toast.success("Wallet connected successfully!");
    } catch (error) {
      console.error("Connection error:", error);
      setError("Failed to connect wallet");
      toast.error("Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  }, [connect, connectors]);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      setAuthState({ isAuthenticated: false });
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect wallet");
    }
  }, [disconnect]);

  const signIn = useCallback(async () => {
    // Check if wallet is connected
    if (!isConnected) {
      console.error("Cannot sign in: Wallet not connected");
      setError("Wallet not connected. Please connect your wallet first.");
      toast.error("Wallet not connected. Please connect your wallet first.");
      return;
    }
    
    // Check if address is available
    if (!address) {
      console.error("Cannot sign in: No wallet address available");
      setError("No wallet address available. Please connect your wallet first.");
      toast.error("No wallet address available. Please connect your wallet first.");
      return;
    }

    try {
      setIsLoading(true);
      
      // Validate address format
      if (!address.startsWith('0x') || address.length < 42) {
        throw new Error(`Invalid address format: ${address}`);
      }
      
      // Use connected chain ID or default
      const chainIdForMessage = chainId || defaultChain.id;
      
      // Prepare SIWE message parameters with thorough validation
      const domain = (window.location.host && window.location.host.length > 0) 
        ? window.location.host 
        : 'localhost:5173';
      const uri = (window.location.origin && window.location.origin.length > 0) 
        ? window.location.origin 
        : 'http://localhost:5173';
      const statement = "Sign in with Ethereum to the app.";
      const version = "1";
      // SIWE requires at least 8 alphanumeric characters for nonce
      const nonce = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      
      // Validate each parameter
      if (!domain || typeof domain !== 'string') {
        throw new Error(`Invalid domain: ${domain}`);
      }
      
      if (!address || typeof address !== 'string') {
        throw new Error(`Invalid address: ${address}`);
      }
      
      if (!statement || typeof statement !== 'string') {
        throw new Error(`Invalid statement: ${statement}`);
      }
      
      if (!uri || typeof uri !== 'string') {
        throw new Error(`Invalid URI: ${uri}`);
      }
      
      if (!version || typeof version !== 'string') {
        throw new Error(`Invalid version: ${version}`);
      }
      
      if (!chainIdForMessage || typeof chainIdForMessage !== 'number') {
        throw new Error(`Invalid chainId: ${chainIdForMessage}`);
      }
      
      if (!nonce || typeof nonce !== 'string') {
        throw new Error(`Invalid nonce: ${nonce}`);
      }
      
      // Create SIWE message parameters object
      const siweParams = {
        domain,
        address,
        statement,
        uri,
        version,
        chainId: chainIdForMessage,
        nonce
      };
      
      console.log("Creating SiweMessage with params:", siweParams);
      
      // Create SIWE message
      const siweMessage = new SiweMessage(siweParams);
      const message = siweMessage.prepareMessage();

      // Request signature
      signMessage({
        account: address as `0x${string}`,
        message,
        onError: (error) => {
          console.error("Sign in error:", error);
          setError("Failed to sign in");
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: false,
          }));
          toast.error("Failed to sign in");
        }
      });

      // Set pending state
      setAuthState({
        isAuthenticated: false,
        message,
      });
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Failed to sign in: " + (error as Error).message);
      toast.error("Failed to sign in: " + (error as Error).message);
      setIsLoading(false);
    }
  }, [address, isConnected, signMessage, chainId, defaultChain.id]);

  const switchToChain = useCallback(async (chain: Chain) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      await switchChain({ chainId: chain.id });
      toast.success(`Switched to ${chain.name} network!`);
    } catch (error) {
      console.error("Error switching network:", error);
      toast.error("Failed to switch network. Please switch manually in your wallet.");
    }
  }, [isConnected, switchChain]);

  const getDisplayName = useCallback(() => {
    if (address) return `${address.slice(0, 6)}...${address.slice(-4)}`;
    return "";
  }, [address]);

  const copyAddress = useCallback(async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        toast.success("Address copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error("Failed to copy address");
      }
    }
  }, [address]);

  // Auto-reconnect to previously connected wallet (if available)
  useEffect(() => {
    // Check if wallet was previously connected and should auto-reconnect
    const wasConnected = localStorage.getItem("wasEVMWalletConnected");
    
    if (wasConnected === "true" && !isConnected && !isLoading && connectors.length > 0) {
      console.log('Auto-reconnecting to previously connected wallet');
      const connector = connectors[0]; // Use first available connector (usually Coinbase)
      connect({ connector }).catch(err => {
        console.warn('Auto-reconnection failed:', err);
        localStorage.removeItem("wasEVMWalletConnected");
      });
    }
  }, []);

  // Track wallet connection state for future auto-reconnect
  useEffect(() => {
    if (isConnected) {
      localStorage.setItem("wasEVMWalletConnected", "true");
    } else {
      localStorage.removeItem("wasEVMWalletConnected");
    }
  }, [isConnected]);

  // Auto-trigger SIWE after wallet connection (only if autoSignIn enabled)
  useEffect(() => {
    if (!autoSignIn) return;
    
    // Only auto-trigger if:
    // 1. Wallet is connected
    // 2. Address is available
    // 3. Not already authenticated
    // 4. Not currently loading
    // 5. Haven't already triggered auto-sign-in for this session
    if (isConnected && address && !authState.isAuthenticated && !isLoading && !hasTriggeredAutoSignIn.current) {
      console.log('Auto-triggering SIWE for address:', address);
      hasTriggeredAutoSignIn.current = true;
      
      // Small delay to ensure wallet is fully ready
      const timer = setTimeout(() => {
        signIn();
      }, 500);
      return () => clearTimeout(timer);
    }
    
    // Reset the flag when wallet disconnects
    if (!isConnected) {
      hasTriggeredAutoSignIn.current = false;
    }
  }, [isConnected, address, authState.isAuthenticated, isLoading, signIn, autoSignIn]);

  return {
    // State
    address,
    isConnected,
    isAuthenticated: authState.isAuthenticated,
    isLoading,
    error,
    copied,
    authState,
    chainId,

    // Actions
    connectWallet,
    disconnectWallet,
    signIn,
    switchToChain,
    getDisplayName,
    copyAddress,
  };
};
