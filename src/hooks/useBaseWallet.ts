import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain } from "wagmi";
import { useCallback, useState, useEffect } from "react";
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

  // Track signature data changes
  useEffect(() => {
    if (signatureData) {
      setAuthState(prev => ({
        ...prev,
        signature: signatureData,
      }));
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
    if (!address) return;

    try {
      setIsLoading(true);
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId: 84532,
        nonce: Math.random().toString(36).substring(7),
      });

      const message = siweMessage.prepareMessage();
      signMessage({
        account: address as `0x${string}`,
        message
      });

      setAuthState({
        isAuthenticated: true,
        message,
        // signature will be set by useEffect when signatureData changes
      });

      toast.success("Successfully signed in!");
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Failed to sign in");
      toast.error("Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  }, [address, signMessage]);

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