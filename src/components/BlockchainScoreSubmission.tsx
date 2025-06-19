import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Trophy, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBlockchainScores } from "@/hooks/useBlockchainScores";
import { WalletConnect } from "./WalletConnect";
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
  const { isAuthenticated } = useAuth();
  const { 
    submitScore, 
    isSubmitting, 
    canSubmit, 
    timeUntilNextSubmission,
    error 
  } = useBlockchainScores();

  const formatTime = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    return minutes > 1 ? `${minutes} minutes` : `${seconds} seconds`;
  };

  const handleSubmitScore = async () => {
    if (!canSubmit || reps === 0) return;

    try {
      // Calculate scores based on exercise type
      const pullups = exercise === 'pull-ups' ? reps : 0;
      const jumps = exercise === 'jumps' ? reps : 0;

      await submitScore(pullups, jumps);
      setHasSubmitted(true);
      onSubmissionComplete?.();
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  };

  // Don't show if no reps completed
  if (reps === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Submit to Blockchain Leaderboard
        </CardTitle>
        <CardDescription>
          Record your {exercise} performance permanently on Base Sepolia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Summary */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{reps}</div>
            <div className="text-xs text-muted-foreground capitalize">{exercise}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{Math.round(averageFormScore)}%</div>
            <div className="text-xs text-muted-foreground">Avg Form</div>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="space-y-3">
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                Connect your Coinbase Smart Wallet to submit scores to the blockchain leaderboard.
              </AlertDescription>
            </Alert>
            <WalletConnect />
          </div>
        ) : hasSubmitted ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Score successfully submitted to blockchain! Check the leaderboard to see your ranking.
            </AlertDescription>
          </Alert>
        ) : !canSubmit && timeUntilNextSubmission > 0 ? (
          <Alert className="border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              You can submit your next score in {formatTime(timeUntilNextSubmission)}.
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
            <Alert>
              <Trophy className="h-4 w-4" />
              <AlertDescription>
                Submit your workout to compete on the blockchain leaderboard. 
                Your scores will be permanently recorded and verifiable.
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={handleSubmitScore}
              disabled={isSubmitting || !canSubmit}
              className="w-full"
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
