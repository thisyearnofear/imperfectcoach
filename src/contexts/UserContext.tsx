import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { cbWalletConnector } from "@/wagmi";
import {
  getContractConfig,
  JUMPS_LEADERBOARD_CONFIG,
  PULLUPS_LEADERBOARD_CONFIG,
} from "@/lib/contracts";
import { SiweMessage } from "siwe";
import { toast } from "sonner";
import { baseSepolia } from "wagmi/chains";
import { useBasename } from "@/hooks/useBasename";
import {
  trackTransaction,
  analyzeTransactionError,
  getCDPStatus,
} from "@/lib/cdp";
import type { Hex } from "viem";

export interface BlockchainScore {
  user: string;
  pullups: number;
  jumps: number;
  timestamp: number;
}

interface UserState {
  // Auth state
  isConnected: boolean;
  isAuthenticated: boolean;
  address?: string;
  isLoading: boolean;
  error?: string;

  // Basename state
  basename?: string;
  isBasenameLoading: boolean;

  // Blockchain state
  leaderboard: BlockchainScore[];
  isLeaderboardLoading: boolean;
  canSubmit: boolean;
  timeUntilNextSubmission: number;
  isSubmitting: boolean;
  lastRefresh?: Date;
  currentTxHash?: string;

  // Smart refresh state
  isRefreshing: boolean;
  dataStale: boolean;
  staleness: number;
  pendingUpdates: boolean;
  lastUserRefresh?: Date;

  // Feature gating state
  hasSubmittedScore: boolean;
}

interface UserActions {
  // Auth actions
  connectWallet: () => Promise<void>;
  signInWithEthereum: () => Promise<void>;
  signOut: () => void;
  connectAndSignIn: () => Promise<void>;
  resetAuth: () => void;

  // Blockchain actions
  submitScore: (pullups: number, jumps: number) => Promise<{ hash?: string }>;
  refreshLeaderboard: () => Promise<void>;
  switchToBaseSepolia: () => Promise<void>;

  // UI helpers
  getDisplayName: () => string;
  copyAddress: () => Promise<void>;
  displayName: string;

  // CDP features
  getCDPFeatures: () => {
    configured: boolean;
    initialized: boolean;
    features: string[];
  };
}

type UserContextType = UserState & UserActions;

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

interface UserProviderOptions {
  requireSiwe?: boolean;
  enableSmartRefresh?: boolean;
}

interface UserProviderProps {
  children: React.ReactNode;
  options?: UserProviderOptions;
}

export const UserProvider = ({ children, options = {} }: UserProviderProps) => {
  const { requireSiwe = true, enableSmartRefresh = true } = options;

  // Wagmi hooks
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessage } = useSignMessage();
  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
  } = useWriteContract();

  // Network switching
  const { switchChain } = useSwitchChain();

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Contract config - use CoachOperator for submissions
  const contractConfig = useMemo(
    () => ({
      address: "0xdEc2d60c9526106a8e4BBd01d70950f6694053A3" as const,
      abi: [
        {
          inputs: [
            {
              components: [
                {
                  internalType: "bytes32[]",
                  name: "exercises",
                  type: "bytes32[]",
                },
                { internalType: "uint32[]", name: "scores", type: "uint32[]" },
                { internalType: "uint256", name: "timestamp", type: "uint256" },
                { internalType: "uint256", name: "nonce", type: "uint256" },
                { internalType: "bytes", name: "signature", type: "bytes" },
              ],
              internalType: "struct CoachOperator.WorkoutSession",
              name: "session",
              type: "tuple",
            },
          ],
          name: "submitWorkoutSession",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ] as const,
    }),
    []
  );

  // Local state
  const [authState, setAuthState] = useState<
    Pick<UserState, "isAuthenticated" | "isLoading" | "error">
  >({
    isAuthenticated: false,
    isLoading: false,
  });
  const [blockchainState, setBlockchainState] = useState<
    Pick<
      UserState,
      | "isSubmitting"
      | "timeUntilNextSubmission"
      | "lastRefresh"
      | "currentTxHash"
    >
  >({
    isSubmitting: false,
    timeUntilNextSubmission: 0,
  });

  // Smart refresh indicators
  const [refreshState, setRefreshState] = useState({
    isRefreshing: false,
    lastUserRefresh: null as Date | null,
    pendingUpdates: false,
    staleness: 0, // 0-100 percentage
  });
  const [copied, setCopied] = useState(false);

  // Basename hook
  const { basename, isLoading: isBasenameLoading } = useBasename(address);

  // Contract reads with smart caching (no auto-refresh)
  // Get leaderboard data from jumps exercise leaderboard
  const {
    data: jumpsLeaderboardData,
    isLoading: isJumpsLoading,
    error: jumpsError,
    status: jumpsStatus,
    refetch: refetchJumpsLeaderboard,
    dataUpdatedAt: jumpsUpdatedAt,
  } = useReadContract({
    ...JUMPS_LEADERBOARD_CONFIG,
    functionName: "getTopUsers",
    args: [10], // Get top 10 users
    chainId: 84532, // Explicitly specify Base Sepolia
    query: {
      enabled: true, // Enable now that leaderboards are deployed
      staleTime: 60000, // 1 minute - data stays fresh longer
      gcTime: 300000, // 5 minutes - keep in cache
      refetchOnWindowFocus: false, // Prevent auto-refresh on focus
      refetchInterval: false, // Disable auto-refresh
    },
  });

  // Get leaderboard data from pullups exercise leaderboard
  const {
    data: pullupsLeaderboardData,
    isLoading: isPullupsLoading,
    error: pullupsError,
    status: pullupsStatus,
    refetch: refetchPullupsLeaderboard,
    dataUpdatedAt: pullupsUpdatedAt,
  } = useReadContract({
    ...PULLUPS_LEADERBOARD_CONFIG,
    functionName: "getTopUsers",
    args: [10], // Get top 10 users
    chainId: 84532, // Explicitly specify Base Sepolia
    query: {
      enabled: true, // Enable now that leaderboards are deployed
      staleTime: 60000, // 1 minute - data stays fresh longer
      gcTime: 300000, // 5 minutes - keep in cache
      refetchOnWindowFocus: false, // Prevent auto-refresh on focus
      refetchInterval: false, // Disable auto-refresh
    },
  });

  // Debug contract read status
  useEffect(() => {
    console.log("📡 Contract read status:", {
      jumps: {
        status: jumpsStatus,
        isLoading: isJumpsLoading,
        hasData: !!jumpsLeaderboardData,
        error: jumpsError,
      },
      pullups: {
        status: pullupsStatus,
        isLoading: isPullupsLoading,
        hasData: !!pullupsLeaderboardData,
        error: pullupsError,
      },
      contractAddress: contractConfig.address,
      chainId: 84532,
    });

    // Test contract deployment on Base Sepolia
    if (jumpsError || pullupsError) {
      console.error("❌ Contract read error:", { jumpsError, pullupsError });
      console.log("🔍 Verifying contract deployment...");
      console.log("📋 Contract details:", {
        jumpsAddress: JUMPS_LEADERBOARD_CONFIG.address,
        pullupsAddress: PULLUPS_LEADERBOARD_CONFIG.address,
        expectedChain: "Base Sepolia (84532)",
        rpcUrl: import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || "fallback RPC",
        hasCustomRpc: !!import.meta.env.VITE_BASE_SEPOLIA_RPC_URL,
      });

      // Check if we can reach Base Sepolia at all
      console.log("🌐 Testing Base Sepolia connectivity...");
      const rpcUrl =
        import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          const chainId = parseInt(data.result, 16);
          console.log("✅ RPC Response:", {
            chainId,
            isBaseSepolia: chainId === 84532,
            response: data,
          });
        })
        .catch((err) => console.error("❌ RPC connectivity test failed:", err));
    }
  }, [
    jumpsStatus,
    pullupsStatus,
    isJumpsLoading,
    isPullupsLoading,
    jumpsLeaderboardData,
    pullupsLeaderboardData,
    jumpsError,
    pullupsError,
    contractConfig.address,
  ]);

  const {
    data: cooldownData,
    refetch: refetchCooldown,
    dataUpdatedAt: cooldownUpdatedAt,
  } = useReadContract({
    ...contractConfig,
    functionName: "getTimeUntilNextSubmission",
    args: address ? [address] : undefined,
    chainId: 84532, // Explicitly specify Base Sepolia
    query: {
      enabled: !!address,
      staleTime: 30000, // 30 seconds for cooldown
      gcTime: 60000, // 1 minute cache
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  });

  // Process combined leaderboard data from both exercise leaderboards
  const leaderboard = useMemo((): BlockchainScore[] => {
    console.log("🏆 Processing combined leaderboard data:", {
      jumpsData: jumpsLeaderboardData,
      pullupsData: pullupsLeaderboardData,
      jumpsIsArray: Array.isArray(jumpsLeaderboardData),
      pullupsIsArray: Array.isArray(pullupsLeaderboardData),
      isConnected,
    });

    // Create a map to combine user data from both leaderboards
    const userMap = new Map<
      string,
      {
        user: string;
        pullups: number;
        jumps: number;
        timestamp: number;
      }
    >();

    // Process jumps leaderboard data
    if (jumpsLeaderboardData && Array.isArray(jumpsLeaderboardData)) {
      jumpsLeaderboardData.forEach(
        (entry: {
          user: string;
          totalScore: bigint;
          bestSingleScore: bigint;
          submissionCount: bigint;
          lastSubmissionTime: bigint;
        }) => {
          userMap.set(entry.user, {
            user: entry.user,
            pullups: 0, // Will be updated if user exists in pullups leaderboard
            jumps: Number(entry.totalScore),
            timestamp: Number(entry.lastSubmissionTime),
          });
        }
      );
    }

    // Process pullups leaderboard data and merge
    if (pullupsLeaderboardData && Array.isArray(pullupsLeaderboardData)) {
      pullupsLeaderboardData.forEach(
        (entry: {
          user: string;
          totalScore: bigint;
          bestSingleScore: bigint;
          submissionCount: bigint;
          lastSubmissionTime: bigint;
        }) => {
          const existing = userMap.get(entry.user);
          if (existing) {
            // User exists in both leaderboards - update pullups and use latest timestamp
            existing.pullups = Number(entry.totalScore);
            existing.timestamp = Math.max(
              existing.timestamp,
              Number(entry.lastSubmissionTime)
            );
          } else {
            // User only in pullups leaderboard
            userMap.set(entry.user, {
              user: entry.user,
              pullups: Number(entry.totalScore),
              jumps: 0,
              timestamp: Number(entry.lastSubmissionTime),
            });
          }
        }
      );
    }

    const processed = Array.from(userMap.values());

    console.log("✅ Processed combined leaderboard:", processed);
    return processed;
  }, [jumpsLeaderboardData, pullupsLeaderboardData, isConnected]);

  const hasSubmittedScore = useMemo(() => {
    if (!address || !leaderboard || leaderboard.length === 0) {
      return false;
    }
    return leaderboard.some(
      (score) => score.user.toLowerCase() === address.toLowerCase()
    );
  }, [address, leaderboard]);

  // Process cooldown data
  useEffect(() => {
    if (cooldownData !== undefined) {
      setBlockchainState((prev) => ({
        ...prev,
        timeUntilNextSubmission: Number(cooldownData),
      }));
    }
  }, [cooldownData]);

  // Check authentication on mount and address change
  useEffect(() => {
    const checkAuth = () => {
      // Clean up legacy auth
      if (localStorage.getItem("simple-auth")) {
        localStorage.removeItem("simple-auth");
        console.log("🧹 Cleaned up legacy simple-auth data");
      }

      // Connection-only mode
      if (!requireSiwe && isConnected && address) {
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
        }));
        return;
      }

      // SIWE mode
      if (requireSiwe) {
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
                isAuthenticated: true,
                isLoading: false,
              }));
              return;
            }
          } catch (error) {
            console.error("Error parsing SIWE auth:", error);
            localStorage.removeItem("siwe-auth");
          }
        }
      }

      // No valid auth
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: requireSiwe ? false : isConnected,
        isLoading: false,
      }));
    };

    checkAuth();
  }, [isConnected, address, requireSiwe]);

  // Auth actions
  const connectWallet = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: undefined }));
      connect({ connector: cbWalletConnector });
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

      const nonce = Math.random().toString(36).substring(2, 15);
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
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(),
      });

      signMessage(
        {
          account: address as `0x${string}`,
          message: message.prepareMessage(),
        },
        {
          onSuccess: (signature: Hex) => {
            const authData = {
              address,
              signature,
              message: message.prepareMessage(),
              domain: window.location.host,
              nonce,
              timestamp: Date.now(),
              expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            };

            localStorage.setItem("siwe-auth", JSON.stringify(authData));
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
        }
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
    if (requireSiwe) {
      localStorage.removeItem("siwe-auth");
    }
    disconnect();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
    });
    toast.success("Signed out successfully");
  }, [disconnect, requireSiwe]);

  const connectAndSignIn = useCallback(async () => {
    if (!isConnected) {
      await connectWallet();
    } else if (requireSiwe && !authState.isAuthenticated) {
      await signInWithEthereum();
    }
  }, [
    isConnected,
    authState.isAuthenticated,
    connectWallet,
    signInWithEthereum,
    requireSiwe,
  ]);

  const resetAuth = useCallback(() => {
    setAuthState((prev) => ({
      ...prev,
      isLoading: false,
      error: undefined,
    }));
  }, []);

  // Handle transaction submission
  useEffect(() => {
    if (txHash) {
      console.log("✅ Transaction submitted:", txHash);
      console.log("📍 Current chain:", chain?.name, "ID:", chain?.id);
      console.log("🎯 Expected chain: Base Sepolia (84532)");

      // Verify we're on the correct chain
      if (chain?.id === 84532) {
        console.log("✅ Correct chain confirmed");
      } else {
        console.warn(
          "⚠️ Wrong chain! Expected Base Sepolia (84532), got:",
          chain?.id
        );
        toast.error("Please switch to Base Sepolia network");
        return;
      }

      // Store transaction hash in state
      setBlockchainState((prev) => ({
        ...prev,
        currentTxHash: txHash,
      }));

      // Track transaction with CDP
      trackTransaction(txHash, {
        gasEstimate: "~0.001 ETH",
        status: "pending",
      });

      toast.success(
        `Transaction submitted! Hash: ${txHash.slice(
          0,
          10
        )}... Waiting for confirmation...`
      );
    }
  }, [txHash, chain]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      console.log("✅ Transaction confirmed:", txHash);

      toast.success(
        `Score confirmed on blockchain! Transaction: ${txHash.slice(0, 10)}...`
      );

      // Smart refresh after confirmation
      setTimeout(async () => {
        await Promise.all([
          refetchJumpsLeaderboard(),
          refetchPullupsLeaderboard(),
          refetchCooldown(),
        ]);
        setBlockchainState((prev) => ({
          ...prev,
          lastRefresh: new Date(),
          isSubmitting: false,
        }));
        setRefreshState((prev) => ({
          ...prev,
          lastUserRefresh: new Date(),
          staleness: 0,
          pendingUpdates: false,
        }));
        toast.success("Leaderboard updated with your new score!");
      }, 2000);
    }
  }, [
    isConfirmed,
    txHash,
    refetchJumpsLeaderboard,
    refetchPullupsLeaderboard,
    refetchCooldown,
  ]);

  // Handle confirmation error
  useEffect(() => {
    if (confirmError) {
      console.error("❌ Transaction failed to confirm:", confirmError);
      toast.error("Transaction failed to confirm on blockchain");
      setBlockchainState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [confirmError]);

  // Handle transaction errors
  useEffect(() => {
    const handleWriteError = async () => {
      if (writeError) {
        console.error("Error submitting score:", writeError);
        setBlockchainState((prev) => ({ ...prev, isSubmitting: false }));

        // Use CDP error analysis for better feedback
        const errorAnalysis = await analyzeTransactionError(writeError);
        const errorMessage = errorAnalysis.suggestion;

        // Show appropriate toast based on severity
        if (errorAnalysis.severity === "high") {
          toast.error(errorMessage, {
            description: errorAnalysis.helpUrl ? "Click for help" : undefined,
            action: errorAnalysis.helpUrl
              ? {
                  label: "Get Help",
                  onClick: () => window.open(errorAnalysis.helpUrl, "_blank"),
                }
              : undefined,
          });
        } else if (errorAnalysis.severity === "medium") {
          toast.error(errorMessage);
        } else {
          toast(errorMessage, {
            description: errorAnalysis.retryable
              ? "You can try again"
              : undefined,
          });
        }

        setAuthState((prev) => ({ ...prev, error: errorMessage }));
      }
    };

    handleWriteError();
  }, [writeError]);

  // Handle isPending and isConfirming state
  useEffect(() => {
    setBlockchainState((prev) => ({
      ...prev,
      isSubmitting: isPending || isConfirming,
    }));
  }, [isPending, isConfirming]);

  // Calculate data staleness
  useEffect(() => {
    if (!enableSmartRefresh) return;

    const updateStaleness = () => {
      const now = Date.now();
      const leaderboardAge = Math.max(
        jumpsUpdatedAt ? now - jumpsUpdatedAt : 0,
        pullupsUpdatedAt ? now - pullupsUpdatedAt : 0
      );
      const maxAge = 300000; // 5 minutes
      const staleness = Math.min((leaderboardAge / maxAge) * 100, 100);

      setRefreshState((prev) => ({
        ...prev,
        staleness,
        pendingUpdates: staleness > 60, // Mark as pending updates after 3 minutes
      }));
    };

    updateStaleness();
    const interval = setInterval(updateStaleness, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [jumpsUpdatedAt, pullupsUpdatedAt, enableSmartRefresh]);

  // Network switching
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
      toast.error(
        "Failed to switch network. Please switch manually in your wallet."
      );
    }
  }, [isConnected, switchChain]);

  // Blockchain actions
  const submitScore = useCallback(
    async (pullups: number, jumps: number): Promise<{ hash?: string }> => {
      if (!isConnected || !address) {
        toast.error("Please connect your wallet first");
        return {};
      }

      if (blockchainState.timeUntilNextSubmission > 0) {
        toast.error(
          `Please wait ${Math.ceil(
            blockchainState.timeUntilNextSubmission / 60
          )} minutes before submitting again`
        );
        return {};
      }

      try {
        // Clear previous transaction hash
        setBlockchainState((prev) => ({
          ...prev,
          isSubmitting: true,
          currentTxHash: undefined,
        }));

        // Debug logging
        console.log("🔄 Submitting transaction...");
        console.log("📍 Current chain:", chain?.name, "ID:", chain?.id);
        console.log("🎯 Contract address:", contractConfig.address);
        console.log("📊 Args:", [BigInt(pullups), BigInt(jumps)]);

        // Check if we're on the correct chain
        if (chain?.id !== 84532) {
          throw new Error("WRONG_NETWORK");
        }

        // Prepare workout session data
        const exercises: `0x${string}`[] = [];
        const scores: number[] = [];

        if (pullups > 0) {
          exercises.push(
            "0x58857c61e1c66c3364b0e545b626ef16ecce5b7b1b9ab12c0857bcb9ee9d12d5"
          ); // pullups hash
          scores.push(pullups);
        }

        if (jumps > 0) {
          exercises.push(
            "0x6b3e0e693d98ab1b983d1bfa5a9cbeb4004247dfd98cdb9ae7b2595f64132e41"
          ); // jumps hash
          scores.push(jumps);
        }

        const workoutSession = {
          exercises,
          scores,
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
          nonce: BigInt(0),
          signature: "0x" as `0x${string}`,
        };

        // Submit transaction using wagmi v2 proper way
        writeContract({
          ...contractConfig,
          functionName: "submitWorkoutSession",
          args: [workoutSession],
          account: address as `0x${string}`,
          chain,
        });

        // Return empty object for now - we'll handle success in useEffect
        return {};
      } catch (error) {
        console.error("Error in submitScore:", error);
        setBlockchainState((prev) => ({ ...prev, isSubmitting: false }));

        // Check for wrong network error first
        if (error.message === "WRONG_NETWORK") {
          toast.error("Wrong Network", {
            description: "Please switch to Base Sepolia to submit scores",
            action: {
              label: "Switch Network",
              onClick: switchToBaseSepolia,
            },
          });
          setAuthState((prev) => ({
            ...prev,
            error: "Please switch to Base Sepolia network",
          }));
          throw new Error("Wrong network");
        }

        // Use CDP error analysis for other errors
        const errorAnalysis = await analyzeTransactionError(error);
        const errorMessage = errorAnalysis.suggestion;

        // Show appropriate toast based on severity
        if (errorAnalysis.severity === "high") {
          toast.error(errorMessage, {
            description: errorAnalysis.helpUrl ? "Click for help" : undefined,
            action: errorAnalysis.helpUrl
              ? {
                  label: "Get Help",
                  onClick: () => window.open(errorAnalysis.helpUrl, "_blank"),
                }
              : undefined,
          });
        } else if (errorAnalysis.severity === "medium") {
          toast.error(errorMessage);
        } else {
          toast(errorMessage, {
            description: errorAnalysis.retryable
              ? "You can try again"
              : undefined,
          });
        }

        setAuthState((prev) => ({ ...prev, error: errorMessage }));
        throw new Error(errorMessage);
      }
    },
    [
      isConnected,
      address,
      chain,
      contractConfig,
      blockchainState.timeUntilNextSubmission,
      writeContract,
      switchToBaseSepolia,
    ]
  );

  const refreshLeaderboard = useCallback(async () => {
    if (refreshState.isRefreshing) return;

    try {
      setRefreshState((prev) => ({ ...prev, isRefreshing: true }));

      await Promise.all([
        refetchJumpsLeaderboard(),
        refetchPullupsLeaderboard(),
        refetchCooldown(),
      ]);

      setBlockchainState((prev) => ({ ...prev, lastRefresh: new Date() }));
      setRefreshState((prev) => ({
        ...prev,
        isRefreshing: false,
        lastUserRefresh: new Date(),
        staleness: 0,
        pendingUpdates: false,
      }));

      toast.success("Leaderboard refreshed!");
    } catch (error) {
      setRefreshState((prev) => ({ ...prev, isRefreshing: false }));
      toast.error("Failed to refresh leaderboard");
    }
  }, [
    refetchJumpsLeaderboard,
    refetchPullupsLeaderboard,
    refetchCooldown,
    refreshState.isRefreshing,
  ]);

  // UI helper functions
  const getDisplayName = useCallback(() => {
    if (basename) return basename;
    if (address) return `${address.slice(0, 6)}...${address.slice(-4)}`;
    return "";
  }, [basename, address]);

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

  // CDP features
  const getCDPFeatures = useCallback(() => {
    return getCDPStatus();
  }, []);

  // Combined state
  const state: UserState = {
    // Auth state
    isConnected,
    isAuthenticated: authState.isAuthenticated,
    address,
    isLoading: authState.isLoading,
    error: authState.error,

    // Basename state
    basename,
    isBasenameLoading,

    // Blockchain state
    leaderboard,
    isLeaderboardLoading: isJumpsLoading || isPullupsLoading,
    canSubmit: isConnected && blockchainState.timeUntilNextSubmission === 0,
    timeUntilNextSubmission: blockchainState.timeUntilNextSubmission,
    isSubmitting: blockchainState.isSubmitting,
    lastRefresh: blockchainState.lastRefresh,
    currentTxHash: blockchainState.currentTxHash,

    // Smart refresh state
    isRefreshing: refreshState.isRefreshing,
    dataStale: refreshState.staleness > 30,
    staleness: refreshState.staleness,
    pendingUpdates: refreshState.pendingUpdates,
    lastUserRefresh: refreshState.lastUserRefresh,

    // Feature gating state
    hasSubmittedScore,
  };

  const displayName = getDisplayName();

  const actions: UserActions = {
    connectWallet,
    signInWithEthereum,
    signOut,
    connectAndSignIn,
    resetAuth,
    submitScore,
    refreshLeaderboard,
    getDisplayName,
    copyAddress,
    displayName,
    getCDPFeatures,
    switchToBaseSepolia,
  };

  const contextValue: UserContextType = {
    ...state,
    ...actions,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
