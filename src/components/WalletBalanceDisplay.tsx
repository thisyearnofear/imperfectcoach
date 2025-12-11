import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { Connection } from "@solana/web3.js";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicKey } from "@solana/web3.js";
import { createPublicClient, http, formatUnits, getAddress } from "viem";
import { baseSepolia } from "viem/chains";

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

// Base Sepolia USDC contract address - use getAddress to ensure proper checksum
const USDC_ADDRESS_BASE = getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
const USDC_MINT_SOLANA = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

export function WalletBalanceDisplay({
  requiredAmount = "0.05",
  currency = "USDC",
  variant = "compact",
  className,
  onInsufficientFunds,
}: WalletBalanceDisplayProps) {
  const { address: baseAddress, isConnected: isBaseConnected } = useAccount();
  const { isSolanaConnected, solanaAddress } = useWalletConnection();
  const solanaConnection = new Connection('https://api.devnet.solana.com');

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

  // Fetch Base balances
  useEffect(() => {
    if (!isBaseConnected || !baseAddress) {
      setBaseBalance(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchBaseBalances = async () => {
      try {
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        // Get ETH balance
        const ethBalance = await publicClient.getBalance({ address: baseAddress });
        const ethAmount = parseFloat(formatUnits(ethBalance, 18));

        // Get USDC balance
        const usdcBalance = await publicClient.readContract({
          address: USDC_ADDRESS_BASE,
          abi: [
            {
              name: "balanceOf",
              type: "function",
              stateMutability: "view",
              inputs: [{ type: "address" }],
              outputs: [{ type: "uint256" }],
            },
          ],
          functionName: "balanceOf",
          args: [baseAddress],
        });

        const usdcAmount = parseFloat(formatUnits(usdcBalance as bigint, 6));

        setBaseBalance({
          chain: "base",
          usdc: usdcAmount,
          native: ethAmount,
          hasEnough: usdcAmount >= required,
          isLoading: false,
        });

        if (usdcAmount < required && onInsufficientFunds) {
          onInsufficientFunds();
        }
      } catch (error) {
        console.error("Failed to fetch Base balances:", error);
        console.error("Base address:", baseAddress);
        console.error("USDC contract address:", USDC_ADDRESS_BASE);
        console.error("Chain:", baseSepolia.id, baseSepolia.name);
        
        setBaseBalance(prev => ({
          ...prev,
          isLoading: false,
          error: "Failed to fetch balance",
        }));
      }
    };

    fetchBaseBalances();
  }, [isBaseConnected, baseAddress, required, onInsufficientFunds]);

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
    const chainName = activeBalance.chain === "base" ? "Base" : "Solana";
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
            <span className="text-gray-400">on {chainName}</span>
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

        {/* Base Chain Balance */}
        {isBaseConnected && (
          <div className="flex items-center justify-between p-2 bg-white/50 rounded">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">B</span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-700">Base Sepolia</div>
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
                    {baseBalance.native.toFixed(4)} ETH
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
