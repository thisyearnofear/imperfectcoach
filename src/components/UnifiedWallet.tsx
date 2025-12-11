import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wallet,
  LogOut,
  Clock,
  Trophy,
  Copy,
  Check,
  Shield,
  Zap,
  Info,
  ChevronRight,
  Brain,
  TrendingDown,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useUser } from "@/hooks/useUserHooks";
import { solanaWalletManager } from "../lib/payments/solana-wallet-adapter";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { useDisplayName } from "@/hooks/useMemoryIdentity";

type WalletVariant = "header" | "card" | "inline" | "minimal" | "dual";
type WalletSize = "sm" | "md" | "lg";
type ChainType = "base" | "avalanche" | "solana" | "all";

interface UnifiedWalletProps {
  variant?: WalletVariant;
  size?: WalletSize;
  className?: string;
  showOnboarding?: boolean;
  chains?: ChainType;
  onConnect?: () => void;
  onAuthenticated?: () => void;
}

const WalletOnboarding = ({ 
  chains = "base",
  onDismiss 
}: { 
  chains?: ChainType;
  onDismiss?: () => void 
}) => {
  const showMultiChain = chains === "all";
  
  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Info className="h-4 w-4 text-primary" />
      <AlertDescription className="text-sm">
        <div className="space-y-2">
          <p className="font-medium text-primary">
            Welcome to Blockchain Fitness!
          </p>
          <p className="text-muted-foreground">
            {showMultiChain 
              ? "Connect your wallets for optimal payment routing and cost savings across multiple blockchains."
              : "Connect your Coinbase Smart Wallet to compete on the global leaderboard and track your progress permanently on-chain."}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {showMultiChain && (
              <>
                <Shield className="h-3 w-3" />
                <span>Multi-Chain</span>
                <span>•</span>
              </>
            )}
            <Shield className="h-3 w-3" />
            <span>Secure</span>
            <span>•</span>
            <Zap className="h-3 w-3" />
            <span>Fast</span>
            <span>•</span>
            <Trophy className="h-3 w-3" />
            <span>Competitive</span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

const CopyableAddress = ({
  address,
  displayName,
  size = "md",
  showFullAddress = false,
}: {
  address: string;
  displayName: string;
  size?: WalletSize;
  showFullAddress?: boolean;
}) => {
  const { copyAddress } = useUser();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await copyAddress();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn(
              "cursor-pointer hover:bg-secondary/80 transition-colors max-w-full",
              sizeClasses[size]
            )}
            onClick={handleCopy}
          >
            <span className="truncate">{displayName}</span>
            {copied ? (
              <Check className="h-3 w-3 ml-1 shrink-0" />
            ) : (
              <Copy className="h-3 w-3 ml-1 opacity-50 shrink-0" />
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to copy: {showFullAddress ? address : displayName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const SolanaWalletState = ({
  onConnect,
  isConnecting,
  address,
  onDisconnect,
  variant,
  size = "md",
}: {
  onConnect: () => void;
  isConnecting: boolean;
  address: string | null;
  onDisconnect: () => void;
  variant: WalletVariant;
  size?: WalletSize;
}) => {
  const [copied, setCopied] = React.useState(false);
  const { displayName } = useDisplayName(address || undefined, 'solana');
  
  const isPhantomAvailable = () => {
    return typeof window !== "undefined" && (window as any)?.solana?.isPhantom;
  };

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Not connected - show install or connect button
  if (!address) {
    if (!isPhantomAvailable()) {
      return (
        <Card className="border border-amber-200 bg-amber-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <div className="text-sm flex-1">
                <div className="font-medium text-amber-800">Phantom Required</div>
                <div className="text-amber-700 text-xs">
                  Install Phantom for Solana support
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open("https://phantom.app/", "_blank")}
              >
                Install
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Button
        onClick={onConnect}
        disabled={isConnecting}
        variant="outline"
        className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Connect Phantom (Solana)
          </>
        )}
      </Button>
    );
  }

  // Connected state
  if (variant === "header") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
          <Zap className="h-3 w-3 mr-1" />
          {displayName}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDisconnect}
          className="h-8 px-2 shrink-0"
        >
          <LogOut className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center space-y-2">
        <Badge variant="default" className="bg-purple-600">
          <Zap className="h-3 w-3 mr-1" />
          <span>Solana Connected</span>
        </Badge>
        <CopyableAddress
          address={address}
          displayName={displayName}
          size={size}
          showFullAddress
        />
      </div>
      <Button onClick={onDisconnect} variant="outline" className="w-full">
        <LogOut className="h-4 w-4 mr-2" />
        Disconnect Solana
      </Button>
    </div>
  );
};

const ConnectButton = ({
  size,
  variant,
  isLoading,
  onConnect,
}: {
  size: WalletSize;
  variant: WalletVariant;
  isLoading: boolean;
  onConnect: () => void;
}) => {
  const sizeProps = {
    sm: { size: "sm" as const, iconSize: "h-3 w-3" },
    md: { size: "default" as const, iconSize: "h-4 w-4" },
    lg: { size: "lg" as const, iconSize: "h-5 w-5" },
  };

  const { size: buttonSize, iconSize } = sizeProps[size];

  if (variant === "minimal") {
    return (
      <Button
        onClick={onConnect}
        disabled={isLoading}
        size={buttonSize}
        variant="ghost"
        className="h-auto p-1"
      >
        <Wallet className={iconSize} />
      </Button>
    );
  }

  return (
    <Button
      onClick={onConnect}
      disabled={isLoading}
      size={buttonSize}
      className={cn(
        variant === "header" && "shrink-0",
        variant === "card" && "w-full"
      )}
    >
      <Wallet className={cn(iconSize, "mr-2")} />
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
};

const AuthenticatedState = ({
  variant,
  size,
}: {
  variant: WalletVariant;
  size: WalletSize;
}) => {
  const { address, displayName, signOut, timeUntilNextSubmission, canSubmit, chainName } =
    useUser();

  const formatTime = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    return minutes > 1 ? `${minutes}m` : `${seconds}s`;
  };

  // Get chain color based on name
  const getChainColor = (chain?: string) => {
    if (!chain) return "bg-gray-100 text-gray-700";
    if (chain.includes("Base")) return "bg-blue-100 text-blue-700";
    if (chain.includes("Avalanche")) return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  if (variant === "header") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
          <Trophy className="h-3 w-3 mr-1 shrink-0" />
          <span className="truncate max-w-24">{displayName}</span>
        </Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="h-8 px-2 shrink-0"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Disconnect wallet</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-xs cursor-pointer">
              <Trophy className="h-3 w-3 mr-1" />
              <span className="truncate max-w-16">{displayName}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Authenticated as {displayName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center space-y-2">
        <Badge variant="default" className="bg-green-600">
          <Trophy className="h-3 w-3 mr-1" />
          <span>Authenticated</span>
        </Badge>
        {chainName && (
          <Badge className={`${getChainColor(chainName)}`}>
            {chainName}
          </Badge>
        )}
        <div className="space-y-1">
          <CopyableAddress
            address={address!}
            displayName={displayName}
            size={size}
            showFullAddress
          />
          {!canSubmit && timeUntilNextSubmission > 0 && (
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Next submission in {formatTime(timeUntilNextSubmission)}
            </Badge>
          )}
        </div>
      </div>
      <Button onClick={signOut} variant="outline" className="w-full">
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
};

const ConnectedNotAuthenticatedState = ({
  variant,
  size,
}: {
  variant: WalletVariant;
  size: WalletSize;
}) => {
  const { address, displayName, signInWithEthereum, signOut, isLoading } =
    useUser();

  if (variant === "header") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              <span>Signing...</span>
            </>
          ) : (
            <>
              <Trophy className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate max-w-24">{displayName}</span>
            </>
          )}
        </Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="h-8 px-2 shrink-0"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Disconnect wallet</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center">
        <Badge variant="default" className="mb-3 bg-green-600 text-white">
          Connected: {displayName}
        </Badge>
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <Trophy className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-green-800 text-center">
              {isLoading ? "🔐 Authenticating..." : "🎯 Submit Score"}
            </p>
            <p className="text-sm text-green-700">
              {isLoading
                ? "Please sign the message in your wallet to complete authentication."
                : "Your wallet is connected! Authentication is required to submit scores."
              }
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        {!isLoading && (
          <Button
            onClick={signInWithEthereum}
            className="w-full"
            variant="outline"
          >
            <Shield className="h-4 w-4 mr-2" />
            Retry Sign-In with Ethereum
          </Button>
        )}

        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>
    </div>
  );
};

type AuthPath = "smart-account" | "solana" | "evm";

const AuthPathSelector = ({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onSelect: (path: AuthPath) => void;
  onClose: () => void;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose your preferred authentication method
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {/* Smart Account: Coinbase Smart Wallet + Base */}
          <Card 
            className="cursor-pointer border-2 hover:border-blue-400 transition-colors"
            onClick={() => {
              onSelect("smart-account");
              onClose();
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-blue-700">
                <Shield className="h-5 w-5" />
                Smart Account (Base)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Secure smart contract wallet via Coinbase
              </p>
              <div className="text-xs text-gray-600">
                ✓ Account abstraction
                <br />
                ✓ Gasless transactions
                <br />
                ✓ Recommended for beginners
              </div>
            </CardContent>
          </Card>

          {/* Solana: Phantom Wallet */}
          <Card 
            className="cursor-pointer border-2 hover:border-purple-400 transition-colors"
            onClick={() => {
              onSelect("solana");
              onClose();
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-purple-700">
                <Zap className="h-5 w-5" />
                Solana (Phantom)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ultra-fast blockchain for micro-payments
              </p>
              <div className="text-xs text-gray-600">
                ✓ 1-second confirmation
                <br />
                ✓ Micro-payment optimization
                <br />
                ✓ 90% lower fees
              </div>
            </CardContent>
          </Card>

          {/* EVM Wallet: RainbowKit/ConnectKit (Base + Avalanche) */}
          <Card 
            className="cursor-pointer border-2 hover:border-emerald-400 transition-colors"
            onClick={() => {
              onSelect("evm");
              onClose();
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
                <Wallet className="h-5 w-5" />
                EVM Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Connect any EVM wallet (Base or Avalanche)
              </p>
              <div className="text-xs text-gray-600">
                ✓ MetaMask, WalletConnect, etc.
                <br />
                ✓ Choice of Base or Avalanche
                <br />
                ✓ Maximum wallet flexibility
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          💡 Choose the method that works best for you. You can connect multiple wallets later.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export const UnifiedWallet = ({
  variant = "card",
  size = "md",
  className,
  showOnboarding = false,
  chains = "base",
  onConnect,
  onAuthenticated,
}: UnifiedWalletProps) => {
  const { isConnected, isAuthenticated, isLoading, connectAndSignIn, switchToChain } =
    useUser();
  const { address: baseAddress } = useAccount();
  const [showChainSelector, setShowChainSelector] = React.useState(false);
  
  // Solana state
  const [solanaState, setSolanaState] = React.useState({
    connected: false,
    address: null as string | null,
    connecting: false,
  });

  // Monitor Solana wallet state
  React.useEffect(() => {
    if (chains !== "solana" && chains !== "all") return;
    
    const updateSolanaState = () => {
      const state = solanaWalletManager.getState();
      setSolanaState({
        connected: state.connected,
        address: state.publicKey?.toString() || null,
        connecting: false,
      });
    };

    updateSolanaState();
    const interval = setInterval(updateSolanaState, 1000);
    return () => clearInterval(interval);
  }, [chains]);

  const handleAuthPathSelected = async (path: AuthPath) => {
    try {
      if (path === "solana") {
        setSolanaState(prev => ({ ...prev, connecting: true }));
        await solanaWalletManager.connect("phantom");
      } else if (path === "smart-account") {
        // Smart Account (Base Sepolia via Coinbase)
        await connectAndSignIn();
      } else if (path === "evm") {
        // EVM Wallet - TODO: integrate RainbowKit/ConnectKit for chain selection
        // For now, trigger connect which will show wallet options
        await connectAndSignIn();
      }
    } catch (error) {
      console.error(`${path} connection failed:`, error);
      alert(`Failed to connect via ${path}. Please try again.`);
    } finally {
      setSolanaState(prev => ({ ...prev, connecting: false }));
    }
  };

  const handleSolanaConnect = async () => {
    setSolanaState(prev => ({ ...prev, connecting: true }));
    try {
      await solanaWalletManager.connect("phantom");
    } catch (error) {
      console.error("Solana connection failed:", error);
      alert("Failed to connect Phantom wallet. Please ensure Phantom is installed.");
    } finally {
      setSolanaState(prev => ({ ...prev, connecting: false }));
    }
  };

  const handleSolanaDisconnect = async () => {
    try {
      await solanaWalletManager.disconnect();
    } catch (error) {
      console.error("Solana disconnect failed:", error);
    }
  };

  // Trigger callbacks
  React.useEffect(() => {
    if (isConnected && onConnect) {
      onConnect();
    }
  }, [isConnected, onConnect]);

  React.useEffect(() => {
    if (isAuthenticated && onAuthenticated) {
      onAuthenticated();
    }
  }, [isAuthenticated, onAuthenticated]);

  // Dual variant: side-by-side Base and Solana
  if (variant === "dual") {
    const baseConnected = isConnected || !!baseAddress;
    const solanaConnected = solanaState.connected;
    const bothConnected = baseConnected && solanaConnected;
    const neitherConnected = !baseConnected && !solanaConnected;
    const oneConnected = (baseConnected && !solanaConnected) || (!baseConnected && solanaConnected);

    return (
      <div className={cn("space-y-6", className)}>
        {/* Connection Status Header */}
        <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Multi-Chain Wallet Setup
            </CardTitle>
            <div className="text-sm text-gray-600">
              Connect wallets for optimal payment routing and cost savings
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className={`h-3 w-3 rounded-full mx-auto ${baseConnected ? "bg-blue-500" : "bg-gray-300"}`} />
                <div className="text-xs font-medium">Base Network</div>
                <div className="text-xs text-gray-500">Coinbase Wallet</div>
              </div>
              <div className="space-y-1">
                <Brain className={`h-6 w-6 mx-auto ${bothConnected ? "text-green-500" : "text-gray-400"}`} />
                <div className="text-xs font-medium">Smart Routing</div>
                <div className="text-xs text-gray-500">
                  {bothConnected ? "Active" : "Pending"}
                </div>
              </div>
              <div className="space-y-1">
                <div className={`h-3 w-3 rounded-full mx-auto ${solanaConnected ? "bg-purple-500" : "bg-gray-300"}`} />
                <div className="text-xs font-medium">Solana Network</div>
                <div className="text-xs text-gray-500">Phantom Wallet</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Connection Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Base Wallet */}
          <Card className="border border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Shield className="h-5 w-5" />
                Base Network
              </CardTitle>
              <div className="text-sm text-blue-600">
                Established • Secure • Premium Services
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAuthenticated ? (
                <AuthenticatedState variant="card" size={size} />
              ) : isConnected ? (
                <ConnectedNotAuthenticatedState variant="card" size={size} />
              ) : (
                <ConnectButton
                  size={size}
                  variant="card"
                  isLoading={isLoading}
                  onConnect={connectAndSignIn}
                />
              )}
              
              {baseConnected && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    Connected to Base Sepolia
                  </div>
                  <div className="text-xs text-gray-600">
                    • Premium analysis payments
                    • Agent coaching sessions  
                    • Established infrastructure
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Solana Wallet */}
          <Card className="border border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Zap className="h-5 w-5" />
                Solana Network
              </CardTitle>
              <div className="text-sm text-purple-600">
                Ultra-Fast • Low Cost • Micro-Payments
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SolanaWalletState
                onConnect={handleSolanaConnect}
                isConnecting={solanaState.connecting}
                address={solanaState.address}
                onDisconnect={handleSolanaDisconnect}
                variant="card"
                size={size}
              />
              
              {solanaConnected && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    Connected to Solana Devnet
                  </div>
                  <div className="text-xs text-gray-600">
                    • Micro-payment optimization
                    • 90% fee reduction potential
                    • Ultra-fast confirmations
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status and Recommendations */}
        <Card className={`${bothConnected ? "border-green-200 bg-green-50" : oneConnected ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}`}>
          <CardContent className="p-4">
            {bothConnected && (
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">Smart Routing Active!</div>
                  <div className="text-sm text-green-700">
                    AI will automatically select the optimal network for each payment
                  </div>
                </div>
              </div>
            )}
            
            {oneConnected && (
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-800">Enhanced Experience Available</div>
                  <div className="text-sm text-amber-700 mb-2">
                    Connect {baseConnected ? "Phantom wallet" : "Coinbase wallet"} for optimal payment routing and cost savings.
                  </div>
                  <div className="text-xs text-amber-600">
                    • Access to both payment networks
                    • Automatic fee optimization  
                    • Seamless fallback systems
                  </div>
                </div>
              </div>
            )}
            
            {neitherConnected && (
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-800">Get Started</div>
                  <div className="text-sm text-blue-700">
                    Connect at least one wallet to access AI fitness coaching features
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits Overview */}
        {bothConnected && (
          <Card className="border-dashed border-gray-200">
            <CardContent className="p-4">
              <div className="text-center space-y-4">
                <div className="font-medium text-gray-800">Multi-Chain Benefits Active</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <TrendingDown className="h-6 w-6 text-green-500 mx-auto" />
                    <div className="font-medium">Cost Savings</div>
                    <div className="text-gray-600">Up to 90% on micro-payments</div>
                  </div>
                  <div className="space-y-1">
                    <Clock className="h-6 w-6 text-blue-500 mx-auto" />
                    <div className="font-medium">Speed</div>
                    <div className="text-gray-600">1-second Solana confirmations</div>
                  </div>
                  <div className="space-y-1">
                    <Shield className="h-6 w-6 text-purple-500 mx-auto" />
                    <div className="font-medium">Reliability</div>
                    <div className="text-gray-600">Automatic fallback systems</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Render based on variant
  if (variant === "header" || variant === "minimal") {
    const baseActive = isConnected || !!baseAddress;
    const solanaActive = solanaState.connected;
    const anyActive = baseActive || solanaActive;

    // If anything is connected, show authenticated state
    if (anyActive) {
      if (solanaActive && !baseActive) {
        return (
          <div className={cn("flex items-center gap-2", className)}>
            <SolanaWalletState
              onConnect={() => setShowChainSelector(true)}
              isConnecting={solanaState.connecting}
              address={solanaState.address}
              onDisconnect={handleSolanaDisconnect}
              variant={variant}
              size={size}
            />
            <AuthPathSelector
              isOpen={showChainSelector}
              onClose={() => setShowChainSelector(false)}
              onSelect={handleAuthPathSelected}
            />
          </div>
        );
      }

      // Base is connected (with or without Solana)
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <div>
            {isAuthenticated ? (
              <AuthenticatedState variant={variant} size={size} />
            ) : isConnected ? (
              <ConnectedNotAuthenticatedState variant={variant} size={size} />
            ) : null}
          </div>
          {!solanaActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChainSelector(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
              title="Connect additional wallet"
            >
              + Network
            </Button>
          )}
          <AuthPathSelector
            isOpen={showChainSelector}
            onClose={() => setShowChainSelector(false)}
            onSelect={handleAuthPathSelected}
          />
        </div>
      );
    }

    // Nothing connected - show unified connect button
    return (
      <>
        <Button
          onClick={() => setShowChainSelector(true)}
          disabled={isLoading || solanaState.connecting}
          size={variant === "header" ? "default" : "sm"}
          className={variant === "header" ? "" : "h-auto p-1"}
          variant={variant === "minimal" ? "ghost" : "default"}
        >
          {variant === "minimal" ? (
            <Wallet className="h-4 w-4" />
          ) : (
            <>
              <Wallet className="h-4 w-4 mr-2" />
              {isLoading || solanaState.connecting ? "Connecting..." : "Connect Wallet"}
            </>
          )}
        </Button>
        <AuthPathSelector
          isOpen={showChainSelector}
          onClose={() => setShowChainSelector(false)}
          onSelect={handleAuthPathSelected}
        />
      </>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("space-y-3", className)}>
        {showOnboarding && !isConnected && <WalletOnboarding chains={chains} />}

        {isAuthenticated ? (
          <AuthenticatedState variant={variant} size={size} />
        ) : isConnected ? (
          <ConnectedNotAuthenticatedState variant={variant} size={size} />
        ) : (
          <ConnectButton
            size={size}
            variant={variant}
            isLoading={isLoading}
            onConnect={connectAndSignIn}
          />
        )}

        {chains === "all" && (
          <SolanaWalletState
            onConnect={handleSolanaConnect}
            isConnecting={solanaState.connecting}
            address={solanaState.address}
            onDisconnect={handleSolanaDisconnect}
            variant="inline"
            size={size}
          />
        )}
      </div>
    );
  }

  // Card variant
  return (
    <>
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Wallet className="h-5 w-5" />
            {isAuthenticated || isConnected || solanaState.connected
              ? "Wallet Connected"
              : "Connect Wallet"}
          </CardTitle>
          <CardDescription>
            {isAuthenticated
              ? "You're ready to compete on the blockchain leaderboard!"
              : isConnected || solanaState.connected
              ? "Complete authentication to unlock all features"
              : "Select a blockchain network to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showOnboarding && !isConnected && !solanaState.connected && <WalletOnboarding chains={chains} />}

          {solanaState.connected && !isConnected ? (
            <SolanaWalletState
              onConnect={() => setShowChainSelector(true)}
              isConnecting={solanaState.connecting}
              address={solanaState.address}
              onDisconnect={handleSolanaDisconnect}
              variant="card"
              size={size}
            />
          ) : isAuthenticated ? (
            <AuthenticatedState variant={variant} size={size} />
          ) : isConnected ? (
            <ConnectedNotAuthenticatedState variant={variant} size={size} />
          ) : (
            <ConnectButton
              size={size}
              variant={variant}
              isLoading={isLoading}
              onConnect={() => setShowChainSelector(true)}
            />
          )}

          {chains === "all" && (solanaState.connected || isConnected) && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Additional Networks</p>
              {!solanaState.connected && isConnected && (
                <SolanaWalletState
                  onConnect={() => setShowChainSelector(true)}
                  isConnecting={solanaState.connecting}
                  address={solanaState.address}
                  onDisconnect={handleSolanaDisconnect}
                  variant="card"
                  size={size}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <AuthPathSelector
        isOpen={showChainSelector}
        onClose={() => setShowChainSelector(false)}
        onSelect={handleAuthPathSelected}
      />
    </>
  );
};

// Convenience components for common use cases
export const HeaderWallet = (props: Omit<UnifiedWalletProps, "variant">) => (
  <UnifiedWallet {...props} variant="header" />
);

export const WalletCard = (props: Omit<UnifiedWalletProps, "variant">) => (
  <UnifiedWallet {...props} variant="card" showOnboarding />
);

export const InlineWallet = (props: Omit<UnifiedWalletProps, "variant">) => (
  <UnifiedWallet {...props} variant="inline" />
);

export const MinimalWallet = (props: Omit<UnifiedWalletProps, "variant">) => (
  <UnifiedWallet {...props} variant="minimal" />
);

export const DualWallet = (props: Omit<UnifiedWalletProps, "variant" | "chains">) => (
  <UnifiedWallet {...props} variant="dual" chains="all" />
);

export const MultiChainWallet = (props: Omit<UnifiedWalletProps, "chains">) => (
  <UnifiedWallet {...props} chains="all" />
);
