import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain } from "wagmi";
import { useCallback, useState, useEffect, useRef } from "react";
import { cbWalletConnector } from "@/wagmi";
import { SiweMessage } from "siwe";
import { toast } from "sonner";
import { baseSepolia } from "wagmi/chains";

interface AuthState {
  isAuthenticated: boolean;
  message?: string;
  signature?: string;
}

export const useBaseWallet = () => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
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

  const connectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      await connect({ connector: cbWalletConnector });
      toast.success("Wallet connected successfully!");
    } catch (error) {
      console.error("Connection error:", error);
      setError("Failed to connect wallet");
      toast.error("Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  }, [connect]);

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
      
      // Prepare SIWE message parameters with thorough validation
      // First, let's log the raw window.location to see what we're working with
      console.log('Raw window.location:', {
        host: window.location.host,
        origin: window.location.origin,
        href: window.location.href,
        hostname: window.location.hostname,
        port: window.location.port,
        protocol: window.location.protocol
      });
      
      // Ensure we have valid non-empty strings for all required fields
      const domain = (window.location.host && window.location.host.length > 0) ? window.location.host : 'localhost:5173';
      const uri = (window.location.origin && window.location.origin.length > 0) ? window.location.origin : 'http://localhost:5173';
      const statement = "Sign in with Ethereum to the app.";
      const version = "1";
      const chainId = 84532; // Base Sepolia
      // SIWE requires at least 8 alphanumeric characters for nonce
      const nonce = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      
      // Log all parameters
      console.log("SIWE parameters before validation:", {
        domain,
        address,
        statement,
        uri,
        version,
        chainId,
        nonce
      });
      
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
      
      if (!chainId || typeof chainId !== 'number') {
        throw new Error(`Invalid chainId: ${chainId}`);
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
        chainId,
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
  }, [address, isConnected, signMessage]);

  const switchToBaseSepolia = useCallback(async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      await switchChain({ chainId: baseSepolia.id });
      toast.success("Switched to Base Sepolia network!");
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

  // Auto-trigger SIWE after wallet connection (modern UX)
  useEffect(() => {
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
  }, [isConnected, address, authState.isAuthenticated, isLoading, signIn]);

  return {
    // State
    address,
    isConnected,
    isAuthenticated: authState.isAuthenticated,
    isLoading,
    error,
    copied,
    authState,

    // Actions
    connectWallet,
    disconnectWallet,
    signIn,
    switchToBaseSepolia,
    getDisplayName,
    copyAddress,
  };
};