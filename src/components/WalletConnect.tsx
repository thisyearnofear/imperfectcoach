import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Wallet, LogOut, Clock, Trophy, Copy, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBlockchainScores } from "@/hooks/useBlockchainScores";
import { useBasename } from "@/hooks/useBasename";
import { useState } from "react";
import { toast } from "sonner";

interface WalletConnectProps {
  compact?: boolean;
}

export const WalletConnect = ({ compact = false }: WalletConnectProps) => {
  const {
    isConnected,
    isAuthenticated,
    address,
    isLoading,
    connectAndSignIn,
    signInWithEthereum,
    signOut,
  } = useAuth();

  const { timeUntilNextSubmission, canSubmit } = useBlockchainScores();
  const { basename, isLoading: basenameLoading } = useBasename(address);
  const [copied, setCopied] = useState(false);

  // Debug logging for state understanding
  console.log("🔍 WalletConnect state:", {
    isConnected,
    isAuthenticated,
    address,
    isLoading,
    basename,
    compact,
  });

  const formatAddress = (addr?: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getDisplayName = (addr?: string) => {
    // OnchainKit returns the basename directly as a string
    if (basename && basename.length > 0) return basename;
    return formatAddress(addr);
  };

  const handleCopyAddress = async () => {
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
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    return minutes > 1 ? `${minutes}m` : `${seconds}s`;
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={handleCopyAddress}
                  >
                    <Trophy className="h-3 w-3 mr-1 shrink-0" />
                    <span>{getDisplayName(address)}</span>
                    {copied ? (
                      <Check className="h-3 w-3 ml-1" />
                    ) : (
                      <Copy className="h-3 w-3 ml-1 opacity-50" />
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to copy address: {address}</p>
                </TooltipContent>
              </Tooltip>
              {!isAuthenticated && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={signInWithEthereum}
                      disabled={isLoading}
                      className="h-7 px-2 text-xs shrink-0"
                    >
                      {isLoading ? "Signing..." : "SIWE"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Sign-In with Ethereum for enhanced security and session
                      management
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {!canSubmit && timeUntilNextSubmission > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(timeUntilNextSubmission)}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="h-8 px-2 shrink-0"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <Button
              onClick={connectAndSignIn}
              disabled={isLoading}
              size="sm"
              className="h-8 shrink-0"
              data-wallet-connect
            >
              <Wallet className="h-3 w-3 mr-1 shrink-0" />
              {isLoading ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Wallet className="h-5 w-5" />
          Blockchain Leaderboard
        </CardTitle>
        <CardDescription>
          Connect your Coinbase Smart Wallet and sign in with SIWE to track
          scores on Base Sepolia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Button
            onClick={connectAndSignIn}
            disabled={isLoading}
            className="w-full"
          >
            <Wallet className="h-4 w-4 mr-2" />
            {isLoading ? "Connecting..." : "Connect Smart Wallet"}
          </Button>
        ) : isConnected && !isAuthenticated ? (
          <div className="space-y-3">
            <div className="text-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={handleCopyAddress}
                    >
                      Connected: <span>{getDisplayName(address)}</span>
                      {copied ? (
                        <Check className="h-3 w-3 ml-1" />
                      ) : (
                        <Copy className="h-3 w-3 ml-1 opacity-50" />
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to copy address: {address}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-2">
              <Button
                onClick={signInWithEthereum}
                disabled={isLoading}
                className="w-full"
                variant="default"
              >
                {isLoading ? "Signing..." : "Sign In with Ethereum"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Optional: Sign in with SIWE for enhanced security and session
                management
              </p>
            </div>
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
        ) : (
          <div className="space-y-3">
            <div className="text-center space-y-2">
              <Badge variant="default" className="bg-green-600">
                <Trophy className="h-3 w-3 mr-1" />
                <span>Authenticated via SIWE</span>
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p
                      className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={handleCopyAddress}
                    >
                      <span>{getDisplayName(address)}</span>
                      {copied ? (
                        <Check className="h-3 w-3 ml-1 inline" />
                      ) : (
                        <Copy className="h-3 w-3 ml-1 inline opacity-50" />
                      )}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to copy address: {address}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {!canSubmit && timeUntilNextSubmission > 0 && (
              <div className="text-center">
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Next submission in {formatTime(timeUntilNextSubmission)}
                </Badge>
              </div>
            )}

            <Button onClick={signOut} variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
