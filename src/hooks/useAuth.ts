import { useCallback, useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { cbWalletConnector } from "@/wagmi";
import { toast } from "sonner";
import { SiweMessage } from "siwe";
import type { Hex } from "viem";

interface AuthState {
  isConnected: boolean;
  isAuthenticated: boolean;
  address?: string;
  isLoading: boolean;
  error?: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isConnected: false,
    isAuthenticated: false,
    isLoading: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessage } = useSignMessage();

  // Check if user is authenticated using SIWE
  useEffect(() => {
    const checkAuth = () => {
      // Clean up legacy simple auth data
      if (localStorage.getItem("simple-auth")) {
        localStorage.removeItem("simple-auth");
        console.log("🧹 Cleaned up legacy simple-auth data");
      }

      const siweAuth = localStorage.getItem("siwe-auth");
      if (siweAuth && isConnected && address) {
        try {
          const authData = JSON.parse(siweAuth);
          const isValid =
            authData.address === address &&
            authData.expiresAt > Date.now() &&
            authData.domain === window.location.host;

          if (isValid) {
            setAuthState((prev) => ({
              ...prev,
              isConnected,
              isAuthenticated: true,
              address,
              isLoading: false,
            }));
            console.log("✅ Valid SIWE authentication found");
            return;
          }
        } catch (error) {
          console.error("Error parsing SIWE auth:", error);
          localStorage.removeItem("siwe-auth");
        }
      }

      // No valid auth found
      setAuthState((prev) => ({
        ...prev,
        isConnected,
        isAuthenticated: false,
        address,
        isLoading: false,
      }));

      setIsInitialized(true);
    };

    checkAuth();
  }, [isConnected, address]);

  const connectWallet = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      connect({
        connector: cbWalletConnector,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to connect wallet",
      }));
      toast.error("Failed to connect wallet");
    }
  }, [connect]);

  const signInWithEthereum = useCallback(async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      // Generate nonce (in production, fetch from your backend)
      const nonce = Math.random().toString(36).substring(2, 15);

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to Imperfect Coach with your Smart Wallet",
        uri: window.location.origin,
        version: "1",
        chainId: 84532, // Base Sepolia
        nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(), // 24 hours
      });

      console.log("📝 SIWE message created:", message.prepareMessage());

      signMessage(
        {
          account: address as `0x${string}`,
          message: message.prepareMessage(),
        },
        {
          onSuccess: (signature: Hex) => {
            console.log("✅ SIWE signature successful:", signature);

            // Store SIWE authentication data
            const authData = {
              address,
              signature,
              message: message.prepareMessage(),
              domain: window.location.host,
              nonce,
              timestamp: Date.now(),
              expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            };

            localStorage.setItem("siwe-auth", JSON.stringify(authData));
            console.log("💾 SIWE auth data stored");

            setAuthState((prev) => ({
              ...prev,
              isAuthenticated: true,
              isLoading: false,
            }));

            toast.success("Successfully signed in with SIWE!");
          },
          onError: (error) => {
            console.error("❌ Error signing SIWE message:", error);

            setAuthState((prev) => ({
              ...prev,
              isLoading: false,
              error: `Failed to sign message: ${error.message}`,
            }));
            toast.error(`Failed to sign message: ${error.message}`);
          },
        },
      );
    } catch (error) {
      console.error("Error in SIWE flow:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Authentication failed",
      }));
      toast.error("Authentication failed");
    }
  }, [address, signMessage]);

  const signOut = useCallback(() => {
    localStorage.removeItem("siwe-auth");
    disconnect();
    setAuthState({
      isConnected: false,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.success("Signed out successfully");
  }, [disconnect]);

  const connectAndSignIn = useCallback(async () => {
    if (!isConnected) {
      await connectWallet();
      // The useEffect will trigger signInWithEthereum once connected
    } else if (!authState.isAuthenticated) {
      await signInWithEthereum();
    }
  }, [
    isConnected,
    authState.isAuthenticated,
    connectWallet,
    signInWithEthereum,
  ]);

  const resetAuth = useCallback(() => {
    setAuthState((prev) => ({
      ...prev,
      isLoading: false,
      error: undefined,
    }));
  }, []);

  // Auto-sign in after wallet connection
  useEffect(() => {
    if (
      isConnected &&
      address &&
      !authState.isAuthenticated &&
      !authState.isLoading
    ) {
      const timer = setTimeout(() => {
        signInWithEthereum();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    isConnected,
    address,
    authState.isAuthenticated,
    authState.isLoading,
    signInWithEthereum,
  ]);

  return {
    ...authState,
    connectWallet,
    signInWithEthereum,
    signOut,
    connectAndSignIn,
    resetAuth,
  };
};
