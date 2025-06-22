import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wallet,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useUserAuth, useUserBlockchain } from "@/hooks/useUserHooks";
import { InlineWallet } from "./UnifiedWallet";
import { NetworkStatus } from "./NetworkStatus";
import { Exercise, RepData } from "@/lib/types";

interface BlockchainScoreSubmissionProps {
  exercise: Exercise;
  reps: number;
  repHistory: RepData[];
  averageFormScore: number;
  onSubmissionComplete?: () => void;
}

export const BlockchainScoreSubmission = ({
  exercise,
  reps,
  repHistory,
  averageFormScore,
  onSubmissionComplete,
}: BlockchainScoreSubmissionProps) => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { isAuthenticated, isConnected, signInWithEthereum } = useUserAuth();
  const { chain } = useAccount();
  const {
    submitScore,
    isSubmitting,
    canSubmit,
    timeUntilNextSubmission,
    currentTxHash,
  } = useUserBlockchain();
  const [error, setError] = useState<string>();

  const isOnCorrectNetwork = chain?.id === 84532; // Base Sepolia

  const formatTime = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    return minutes > 1 ? `${minutes} minutes` : `${seconds} seconds`;
  };

  const handleSubmitScore = async () => {
    if (!canSubmit || reps === 0) return;

    try {
      setError(undefined);
      // Calculate scores based on exercise type
      const pullups = exercise === "pull-ups" ? reps : 0;
      const jumps = exercise === "jumps" ? reps : 0;

      await submitScore(pullups, jumps);
      setHasSubmitted(true);
      onSubmissionComplete?.();
    } catch (error) {
      console.error("Failed to submit score:", error);
      setError("Failed to submit score to blockchain");
    }
  };

  // Don't show if no reps completed
  if (reps === 0) {
    return null;
  }

  return (
    <Card className="w-full border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Trophy className="h-5 w-5" />
          🎉 Submit to Blockchain Leaderboard
        </CardTitle>
        <CardDescription>
          Record your amazing {exercise} performance permanently on Base Sepolia
          and compete globally!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Summary */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{reps}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {exercise}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.round(averageFormScore)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Form</div>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-3">
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                Connect your Coinbase Smart Wallet to submit scores to the
                blockchain leaderboard.
              </AlertDescription>
            </Alert>
            <InlineWallet showOnboarding={false} />
          </div>
        ) : !isAuthenticated ? (
          <div className="space-y-3">
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                Please sign in with your wallet to submit your score.
              </AlertDescription>
            </Alert>
            <Button onClick={() => signInWithEthereum()} className="w-full">
              Sign-In with Ethereum
            </Button>
          </div>
        ) : hasSubmitted ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              🎉 Score successfully submitted to blockchain! Check the
              leaderboard to see your ranking.
              {currentTxHash && (
                <div className="mt-2 text-xs text-green-700">
                  <span className="font-mono">
                    Transaction: {currentTxHash.slice(0, 10)}...
                    {currentTxHash.slice(-8)}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 ml-2 text-green-700 hover:text-green-800"
                    onClick={() =>
                      window.open(
                        `https://sepolia.basescan.org/tx/${currentTxHash}`,
                        "_blank"
                      )
                    }
                  >
                    View on Explorer ↗
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : !isOnCorrectNetwork ? (
          <div className="space-y-3">
            <NetworkStatus variant="alert" showSwitchButton={true} />
          </div>
        ) : !canSubmit && timeUntilNextSubmission > 0 ? (
          <Alert className="border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              You can submit your next score in{" "}
              {formatTime(timeUntilNextSubmission)}.
            </AlertDescription>
          </Alert>
        ) : error ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <Alert className="border-primary/20 bg-primary/5">
              <Trophy className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary/90">
                🚀 Ready to make it official? Submit your workout to compete on
                the global blockchain leaderboard. Your scores will be
                permanently recorded and verifiable by anyone!
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSubmitScore}
              disabled={isSubmitting || !canSubmit || !isOnCorrectNetwork}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting to Blockchain...
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4 mr-2" />
                  Submit {reps} {exercise} to Leaderboard
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                ⛓️ Base Sepolia
              </Badge>
              <span>•</span>
              <span>Gas fees covered by smart wallet</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
