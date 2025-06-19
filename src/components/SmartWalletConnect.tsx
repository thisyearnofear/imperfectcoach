import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, LogOut, Clock, Trophy } from "lucide-react";
import { useSmartWalletAuth } from "@/hooks/useSmartWalletAuth";
import { useBlockchainScores } from "@/hooks/useBlockchainScores";

interface SmartWalletConnectProps {
  compact?: boolean;
}

export const SmartWalletConnect = ({ compact = false }: SmartWalletConnectProps) => {
  const {
    isConnected,
    isAuthenticated,
    address,
    isLoading,
    connectAndSignIn,
    signOut,
  } = useSmartWalletAuth();

  const { timeUntilNextSubmission, canSubmit } = useBlockchainScores();

  const formatAddress = (addr?: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    return minutes > 1 ? `${minutes}m` : `${seconds}s`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <Badge variant="secondary" className="text-xs">
              <Trophy className="h-3 w-3 mr-1" />
              {formatAddress(address)}
            </Badge>
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
              className="h-8 px-2"
            >
              <LogOut className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <Button
            onClick={connectAndSignIn}
            disabled={isLoading}
            size="sm"
            className="h-8"
            data-wallet-connect
          >
            <Wallet className="h-3 w-3 mr-1" />
            {isLoading ? "Connecting..." : "Smart Wallet"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Wallet className="h-5 w-5" />
          Smart Wallet Leaderboard
        </CardTitle>
        <CardDescription>
          Connect your Coinbase Smart Wallet to track scores on Base Sepolia
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
        ) : !isAuthenticated ? (
          <div className="space-y-3">
            <div className="text-center">
              <Badge variant="outline">
                Connected: {formatAddress(address)}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Sign in with Ethereum (SIWE) to authenticate your Smart Wallet
              </p>
              <Button
                onClick={connectAndSignIn}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Signing..." : "Sign In with Ethereum"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center space-y-2">
              <Badge variant="default" className="bg-green-600">
                <Trophy className="h-3 w-3 mr-1" />
                Authenticated via SIWE
              </Badge>
              <p className="text-sm text-muted-foreground">
                {formatAddress(address)}
              </p>
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
