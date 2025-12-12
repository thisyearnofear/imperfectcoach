import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { Connection } from "@solana/web3.js";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicKey } from "@solana/web3.js";
import { createPublicClient, http, formatUnits, getAddress, Chain } from "viem";
import { baseSepolia, avalancheFuji } from "viem/chains";

interface WalletBalanceDisplayProps {
  requiredAmount?: string; // e.g. "0.05"
  currency?: "USDC" | "SOL";
  variant?: "compact" | "detailed";
  className?: string;
  onInsufficientFunds?: () => void;
}

interface ChainBalance {
  chain: "base" | "solana";
  usdc: number;
  native: number; // ETH or SOL
  hasEnough: boolean;
  isLoading: boolean;
  error?: string;
}

// USDC contract addresses for supported chains
const USDC_ADDRESS_BASE = getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
const USDC_ADDRESS_AVALANCHE = getAddress("0x5425890298aed601595a70AB815c96711a31Bc65");
const USDC_MINT_SOLANA = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

// Helper to get chain config based on chainId
const getChainConfig = (chainId: number | undefined): { chain: Chain; usdcAddress: `0x${string}`; name: string } => {
  if (chainId === avalancheFuji.id) {
    return { chain: avalancheFuji, usdcAddress: USDC_ADDRESS_AVALANCHE, name: "Avalanche Fuji" };
  }
  // Default to Base Sepolia
  return { chain: baseSepolia, usdcAddress: USDC_ADDRESS_BASE, name: "Base Sepolia" };
};

export function WalletBalanceDisplay({
  requiredAmount = "0.05",
  currency = "USDC",
  variant = "compact",
  className,
  onInsufficientFunds,
}: WalletBalanceDisplayProps) {
  const { address: baseAddress, isConnected: isBaseConnected } = useAccount();
  const chainId = useChainId();
  const { isSolanaConnected, solanaAddress } = useWalletConnection();
  const solanaConnection = new Connection('https://api.devnet.solana.com');

  // Get the current chain config based on connected chain
  const { chain: currentChain, usdcAddress: currentUsdcAddress, name: currentChainName } = getChainConfig(chainId);

  const [baseBalance, setBaseBalance] = useState<ChainBalance>({
    chain: "base",
    usdc: 0,
    native: 0,
    hasEnough: false,
    isLoading: true,
  });

  const [solanaBalance, setSolanaBalance] = useState<ChainBalance>({
    chain: "solana",
    usdc: 0,
    native: 0,
    hasEnough: false,
    isLoading: true,
  });

  const required = parseFloat(requiredAmount);

  // Fetch EVM chain balances (Base Sepolia or Avalanche Fuji)
  useEffect(() => {
    if (!isBaseConnected || !baseAddress) {
      setBaseBalance(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchEVMBalances = async () => {
      try {
        const publicClient = createPublicClient({
          chain: currentChain,
          transport: http(),
        });

        // Get native token balance (ETH for Base, AVAX for Avalanche)
        const nativeBalance = await publicClient.getBalance({ address: baseAddress });
        const nativeAmount = parseFloat(formatUnits(nativeBalance, 18));

        // Get USDC balance
        const usdcBalance = await publicClient.readContract({
          address: currentUsdcAddress,
          abi: [
            {
              name: "balanceOf",
              type: "function",
              stateMutability: "view",
              inputs: [{ type: "address" }],
              outputs: [{ type: "uint256" }],
            },
          ] as const,
          functionName: "balanceOf",
          args: [baseAddress],
        } as any);

        const usdcAmount = parseFloat(formatUnits(usdcBalance as bigint, 6));

        setBaseBalance({
          chain: "base",
          usdc: usdcAmount,
          native: nativeAmount,
          hasEnough: usdcAmount >= required,
          isLoading: false,
        });

        if (usdcAmount < required && onInsufficientFunds) {
          onInsufficientFunds();
        }
      } catch (error) {
        console.error(`Failed to fetch ${currentChainName} balances:`, error);
        console.error("Address:", baseAddress);
        console.error("USDC contract address:", currentUsdcAddress);
        console.error("Chain:", currentChain.id, currentChainName);

        setBaseBalance(prev => ({
          ...prev,
          isLoading: false,
          error: "Failed to fetch balance",
        }));
      }
    };

    fetchEVMBalances();
  }, [isBaseConnected, baseAddress, required, onInsufficientFunds, chainId, currentChain, currentUsdcAddress, currentChainName]);

  // Fetch Solana balances
  useEffect(() => {
    if (!isSolanaConnected || !solanaAddress) {
      setSolanaBalance(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchSolanaBalances = async () => {
      try {
        // Get SOL balance
        const publicKey = new PublicKey(solanaAddress);
        const solBalance = await solanaConnection.getBalance(publicKey);
        const solAmount = solBalance / 1e9; // Convert lamports to SOL

        // Get USDC balance (SPL token)
        // This is simplified - in production you'd use getTokenAccountsByOwner
        let usdcAmount = 0;
        try {
          const usdcMint = new PublicKey(USDC_MINT_SOLANA);
          // For MVP, we'll skip USDC balance check on Solana
          // In production, implement proper SPL token balance fetching
          usdcAmount = 0;
        } catch (err) {
          console.warn("USDC balance check skipped for Solana");
        }

        setSolanaBalance({
          chain: "solana",
          usdc: usdcAmount,
          native: solAmount,
          hasEnough: usdcAmount >= required,
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to fetch Solana balances:", error);
        setSolanaBalance(prev => ({
          ...prev,
          isLoading: false,
          error: "Failed to fetch balance",
        }));
      }
    };

    fetchSolanaBalances();
  }, [isSolanaConnected, solanaAddress, solanaConnection, required]);

  const refresh = () => {
    if (isBaseConnected) {
      setBaseBalance(prev => ({ ...prev, isLoading: true }));
    }
    if (isSolanaConnected) {
      setSolanaBalance(prev => ({ ...prev, isLoading: true }));
    }
  };

  // Don't show if no wallet connected
  if (!isBaseConnected && !isSolanaConnected) {
    return null;
  }

  // Compact variant - inline badge style
  if (variant === "compact") {
    const activeBalance = isSolanaConnected ? solanaBalance : baseBalance;
    // For EVM, use the dynamically detected chain name; for Solana, show "Solana"
    const displayChainName = isSolanaConnected ? "Solana" : (chainId === avalancheFuji.id ? "Avalanche" : "Base");
    const showCurrency = activeBalance.chain === "solana" ? "SOL" : "USDC";
    const displayAmount = activeBalance.chain === "solana" ? activeBalance.native : activeBalance.usdc;

    return (
      <div className={cn("inline-flex items-center gap-2 text-xs", className)}>
        <Wallet className="h-3 w-3 text-purple-600" />
        <span className="text-gray-600">Balance:</span>
        {activeBalance.isLoading ? (
          <span className="text-gray-400">Loading...</span>
        ) : (
          <>
            <Badge
              variant="outline"
              className={cn(
                "font-mono",
                (activeBalance.chain === "solana" && activeBalance.native > 0.001) ||
                  (activeBalance.chain === "base" && activeBalance.hasEnough)
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-orange-50 text-orange-700 border-orange-200"
              )}
            >
              {displayAmount.toFixed(activeBalance.chain === "solana" ? 3 : 2)} {showCurrency}
            </Badge>
            <span className="text-gray-400">on {displayChainName}</span>
          </>
        )}
      </div>
    );
  }

  // Detailed variant - card with both chains
  return (
    <Card className={cn("border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50", className)}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Your Balances</span>
          </div>
          <button
            onClick={refresh}
            className="p-1 hover:bg-purple-100 rounded transition-colors"
            disabled={baseBalance.isLoading || solanaBalance.isLoading}
          >
            <RefreshCw className={cn(
              "h-3 w-3 text-purple-600",
              (baseBalance.isLoading || solanaBalance.isLoading) && "animate-spin"
            )} />
          </button>
        </div>

        {/* EVM Chain Balance (Base Sepolia or Avalanche Fuji) */}
        {isBaseConnected && (
          <div className="flex items-center justify-between p-2 bg-white/50 rounded">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                chainId === avalancheFuji.id ? "bg-red-100" : "bg-blue-100"
              )}>
                <span className={cn(
                  "text-xs font-bold",
                  chainId === avalancheFuji.id ? "text-red-600" : "text-blue-600"
                )}>
                  {chainId === avalancheFuji.id ? "A" : "B"}
                </span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-700">{currentChainName}</div>
                <div className="text-[10px] text-gray-500">{baseAddress?.slice(0, 6)}...{baseAddress?.slice(-4)}</div>
              </div>
            </div>
            <div className="text-right">
              {baseBalance.isLoading ? (
                <div className="text-xs text-gray-400">Loading...</div>
              ) : baseBalance.error ? (
                <div className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Error
                </div>
              ) : (
                <>
                  <div className="text-sm font-mono font-bold text-gray-800">
                    {baseBalance.usdc.toFixed(2)} USDC
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {baseBalance.native.toFixed(4)} {chainId === avalancheFuji.id ? "AVAX" : "ETH"}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Solana Chain Balance */}
        {isSolanaConnected && (
          <div className="flex items-center justify-between p-2 bg-white/50 rounded">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600">S</span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-700">Solana Devnet</div>
                <div className="text-[10px] text-gray-500">
                  {solanaAddress?.slice(0, 6)}...{solanaAddress?.slice(-4)}
                </div>
              </div>
            </div>
            <div className="text-right">
              {solanaBalance.isLoading ? (
                <div className="text-xs text-gray-400">Loading...</div>
              ) : solanaBalance.error ? (
                <div className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Error
                </div>
              ) : (
                <>
                  <div className="text-sm font-mono font-bold text-gray-800">
                    {solanaBalance.native.toFixed(4)} SOL
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {solanaBalance.usdc > 0 ? `${solanaBalance.usdc.toFixed(2)} USDC` : 'Pays with SOL'}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Payment Affordability Status */}
        <div className="pt-2 border-t border-purple-100">
          {(() => {
            // For Solana: Check SOL balance (since we accept SOL payments)
            // For Base: Check USDC balance (traditional flow)
            const solanaCanAfford = isSolanaConnected && solanaBalance.native >= (required * 0.002); // ~$0.05 = 0.0001 SOL
            const baseCanAfford = isBaseConnected && baseBalance.hasEnough;
            const hasAnyEnough = solanaCanAfford || baseCanAfford;

            const bothLoading = (isBaseConnected && baseBalance.isLoading) ||
              (isSolanaConnected && solanaBalance.isLoading);

            if (bothLoading) {
              return (
                <div className="text-xs text-gray-500 text-center">
                  Checking balances...
                </div>
              );
            }

            if (hasAnyEnough) {
              const paymentMethod = isSolanaConnected ? "SOL" : "USDC";
              return (
                <div className="flex items-center justify-center gap-1 text-xs text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Ready to pay ${required.toFixed(2)} with {paymentMethod}</span>
                </div>
              );
            }

            // Show appropriate insufficient funds message
            if (isSolanaConnected) {
              return (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-xs text-orange-700">
                    <AlertCircle className="h-3 w-3" />
                    <span>Need more SOL for payment</span>
                  </div>
                  <div className="text-[10px] text-center text-gray-500">
                    Need ~0.0001 SOL (${required.toFixed(2)}) • Get from Solana faucet
                  </div>
                </div>
              );
            } else {
              return (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1 text-xs text-orange-700">
                    <AlertCircle className="h-3 w-3" />
                    <span>Insufficient USDC balance</span>
                  </div>
                  <div className="text-[10px] text-center text-gray-500">
                    Need {required.toFixed(2)} USDC • Get testnet tokens from faucet
                  </div>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </Card>
  );
}
