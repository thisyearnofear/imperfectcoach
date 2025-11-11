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
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { InlineWallet } from "./UnifiedWallet";
import { NetworkStatus } from "./NetworkStatus";
import { ChainSelector } from "./ChainSelector";
import { Exercise, RepData } from "@/lib/types";
import {
  getDefaultChain,
  getAvailableChains,
  ChainType,
} from "@/lib/chainRouting";

interface BlockchainScoreSubmissionProps {
  exercise: Exercise;
  reps: number;
  repHistory: RepData[];
  averageFormScore: number;
  onSubmissionComplete?: () => void;
  submitPersonalRecord?: () => void;
}

export const BlockchainScoreSubmission = ({
  exercise,
  reps,
  repHistory,
  averageFormScore,
  onSubmissionComplete,
  submitPersonalRecord,
}: BlockchainScoreSubmissionProps) => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [selectedChain, setSelectedChain] = useState<ChainType | null>(null);
  const [showChainSelector, setShowChainSelector] = useState(false);
  
  // Base chain hooks
  const { isAuthenticated, isConnected, signInWithEthereum } = useUserAuth();
  const { chain } = useAccount();
  const {
    submitScore,
    isSubmitting,
    canSubmit,
    timeUntilNextSubmission,
    currentTxHash,
  } = useUserBlockchain();

  // Solana chain hooks
  const {
    solanaAddress,
    isSolanaConnected,
    isSolanaLoading,
    submitScoreToSolanaContract,
  } = useSolanaWallet();

  const [error, setError] = useState<string>();

  const isOnCorrectNetwork = chain?.id === 84532; // Base Sepolia
  const availableChains = getAvailableChains({
    baseAddress: isConnected ? "0x..." : undefined,
    solanaAddress,
    isBaseConnected: isConnected && isAuthenticated,
    isSolanaConnected,
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    return minutes > 1 ? `${minutes} minutes` : `${seconds} seconds`;
  };

  // Helper to convert exercise name to Solana exercise type
  const getExerciseType = (exerciseName: Exercise): "pullups" | "jumps" => {
    return exerciseName === "pull-ups" ? "pullups" : "jumps";
  };

  const handleChainSelected = async (chain: ChainType) => {
    setShowChainSelector(false);
    setSelectedChain(chain);

    const pullups = exercise === "pull-ups" ? reps : 0;
    const jumps = exercise === "jumps" ? reps : 0;

    try {
      setError(undefined);

      if (chain === "base") {
        await submitScore(pullups, jumps);
      } else if (chain === "solana") {
        // Validate Solana contracts are deployed
        const { getLeaderboardAddress, areAddressesConfigured } = await import("@/lib/solana/config");
        
        if (!areAddressesConfigured()) {
          throw new Error("Solana contracts not yet deployed. Try Base Sepolia instead.");
        }

        const exerciseType = getExerciseType(exercise);
        const leaderboardAddress = getLeaderboardAddress(exerciseType);

        await submitScoreToSolanaContract(
          pullups,
          jumps,
          leaderboardAddress
        );
      }

      setHasSubmitted(true);
      // Submit personal record when blockchain submission is successful
      submitPersonalRecord?.();
      onSubmissionComplete?.();
    } catch (error) {
      console.error("Failed to submit score:", error);
      setError(`Failed to submit score to ${chain}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSubmitScore = async () => {
    if (reps === 0) return;

    // Determine which chain to use
    const defaultChain = getDefaultChain({
      baseAddress: isConnected ? "0x..." : undefined,
      solanaAddress,
      isBaseConnected: isConnected && isAuthenticated,
      isSolanaConnected,
    });

    if (defaultChain === "none") {
      setError("Please connect a wallet first");
      return;
    }

    if (defaultChain === null) {
      // Both chains connected - show selector
      setShowChainSelector(true);
      return;
    }

    // Single chain connected - submit directly
    await handleChainSelected(defaultChain);
  };

  // Don't show if no reps completed
  if (reps === 0) {
    return null;
  }

  return (
    <>
      <ChainSelector
        open={showChainSelector}
        onChainSelected={handleChainSelected}
        onCancel={() => setShowChainSelector(false)}
        baseConnected={isConnected && isAuthenticated}
        solanaConnected={isSolanaConnected}
      />

      <Card className="w-full border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary justify-center">
            <Trophy className="h-5 w-5" />
            🎉 Submit to Blockchain Leaderboard
          </CardTitle>
          <CardDescription>
            Record your amazing {exercise} performance permanently on-chain
            and compete globally!{" "}
            {availableChains.length > 1 && (
              <span className="text-xs mt-1 block">
                (Choose your chain when submitting)
              </span>
            )}
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

        {!isConnected && !isSolanaConnected ? (
          <div className="space-y-3">
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                Connect your Coinbase Smart Wallet or Solana wallet to submit
                scores to the blockchain leaderboard.
              </AlertDescription>
            </Alert>
            <InlineWallet showOnboarding={false} chains="all" />
          </div>
        ) : isConnected && !isAuthenticated ? (
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
                {availableChains.length > 1
                  ? "🚀 Both wallets connected! Choose your chain when submitting."
                  : isSolanaConnected
                    ? "🚀 Solana connected! Ready to submit your score to Solana Devnet."
                    : "🚀 Base connected! Ready to submit your score to Base Sepolia."
                }
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSubmitScore}
              disabled={
                (isSubmitting || isSolanaLoading) ||
                (!isConnected && !isSolanaConnected) ||
                (isConnected && !isOnCorrectNetwork && !isSolanaConnected) ||
                (isConnected && !canSubmit && !isSolanaConnected) ||
                reps === 0
              }
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              size="lg"
            >
              {isSubmitting || isSolanaLoading ? (
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

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap">
              {availableChains.length > 0 && (
                <>
                  <Badge variant="outline" className="text-xs">
                    {availableChains.includes("base") && "⛓️ Base"}
                    {availableChains.includes("solana") && availableChains.includes("base") && " + "}
                    {availableChains.includes("solana") && "◎ Solana"}
                  </Badge>
                  <span>•</span>
                </>
              )}
              <span>
                {isSolanaConnected
                  ? "Solana transaction fees ~0.00025 SOL"
                  : "Gas fees covered by smart wallet"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
};
