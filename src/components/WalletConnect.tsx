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
import { useAuth } from "@/hooks/useAuth";
import { useBlockchainScores } from "@/hooks/useBlockchainScores";
import { useBasename } from "@/hooks/useBasename";

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
    signOut,
  } = useAuth();

  const { timeUntilNextSubmission, canSubmit } = useBlockchainScores();
  const { basename, isLoading: basenameLoading } = useBasename(address);

  // Quick debug check
  if (isAuthenticated && address) {
    console.log(
      "✅ User is authenticated with address:",
      address,
      "basename:",
      basename,
    );
  }

  const formatAddress = (addr?: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getDisplayName = (addr?: string) => {
    // OnchainKit returns the basename directly as a string
    if (basename && basename.length > 0) return basename;
    return formatAddress(addr);
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
              <span>{getDisplayName(address)}</span>
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
            {isLoading ? "Signing..." : "Connect"}
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
        ) : !isAuthenticated ? (
          <div className="space-y-3">
            <div className="text-center">
              <Badge variant="outline">
                Connected: <span>{getDisplayName(address)}</span>
              </Badge>
            </div>
            <Button
              onClick={connectAndSignIn}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Signing..." : "Sign In with Ethereum"}
            </Button>
            {!isLoading && (
              <p className="text-xs text-center text-muted-foreground">
                Click to sign in with SIWE (Sign-In with Ethereum)
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center space-y-2">
              <Badge variant="default" className="bg-green-600">
                <Trophy className="h-3 w-3 mr-1" />
                <span>Authenticated via SIWE</span>
              </Badge>
              <p className="text-sm text-muted-foreground">
                <span>{getDisplayName(address)}</span>
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
