import { useState } from "react";
import { useAccount, useConnectorClient } from "wagmi";
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Trophy } from "lucide-react";
import { useAWSAIFeedback } from "@/hooks/useAWSAIFeedback";

interface WorkoutData {
  exercise: string;
  reps: number;
  averageFormScore: number;
  repHistory: Array<{
    score: number;
    details?: Record<string, unknown>;
  }>;
  duration?: number;
  keypoints?: unknown[];
}

interface AnalysisResult {
  analysis: string;
  score?: number;
  recommendations?: string[];
}

interface PremiumAnalysisUpsellProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  workoutData: WorkoutData;
  onAnalysisComplete: (analysis: AnalysisResult) => void;
}

const PremiumAnalysisUpsell = ({
  isOpen,
  onOpenChange,
  workoutData,
  onAnalysisComplete,
}: PremiumAnalysisUpsellProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [analysisData, setAnalysisData] = useState<string | null>(null);
  const { isConnected } = useAccount();
  const { data: walletClient } = useConnectorClient();
  const { getSTEDDIEAnalysis } = useAWSAIFeedback({
    exercise: workoutData.exercise,
    coachPersonality: "supportive",
  });

  const handlePaymentAndAnalysis = async () => {
    if (!isConnected || !walletClient) {
      setError("Please connect your wallet to proceed.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("🐢 Calling STEDDIE Premium Analysis...");
      console.log("Request payload:", JSON.stringify(workoutData, null, 2));

      // Call STEDDIE with x402 payment
      const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient);

      const analysisResult = await getSTEDDIEAnalysis(
        {
          exercise: workoutData.exercise,
          reps: workoutData.reps,
          averageFormScore: workoutData.averageFormScore,
          duration:
            workoutData.repHistory.length > 0
              ? workoutData.repHistory[workoutData.repHistory.length - 1]
                  .timestamp - workoutData.repHistory[0].timestamp
              : 0,
          repHistory: workoutData.repHistory,
        },
        fetchWithPayment
      );

      console.log("🐢 STEDDIE analysis received");
      setAnalysisData(analysisResult);
      setShowResults(true);
      onAnalysisComplete({ analysis: analysisResult });
    } catch (err: unknown) {
      console.error("Premium Analysis Error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowResults(false);
    setAnalysisData(null);
    setError(null);
    onOpenChange(false);
  };

  const extractScore = (analysis: string): string => {
    const scoreMatch = analysis.match(/Score:\s*(\d+)\/100|(\d+)\/100/);
    return scoreMatch ? scoreMatch[1] || scoreMatch[2] : "85";
  };

  const extractSummary = (analysis: string): string => {
    const lines = analysis.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes("Summary") || line.includes("Performance")) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && !nextLine.startsWith("#") && nextLine.length > 20) {
          return (
            nextLine.substring(0, 150) + (nextLine.length > 150 ? "..." : "")
          );
        }
      }
    }
    return "Analysis completed - check details below.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-md">
        {!showResults ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                🐢 Unlock STEDDIE Premium Analysis
              </DialogTitle>
              <DialogDescription>
                Get expert coaching insights from STEDDIE and a permanent
                on-chain record of your workout for just $0.25.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4">
              <p className="font-semibold">What STEDDIE 🐢 provides:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>Deep-dive form analysis powered by Amazon Nova Lite.</li>
                <li>
                  Expert-level coaching insights and personalized
                  recommendations.
                </li>
                <li>
                  Comprehensive performance scoring with detailed rationale.
                </li>
                <li>
                  Your "WIP Passport" NFT will be minted or updated on-chain.
                </li>
                <li>A permanent, verifiable record of your progress.</li>
              </ul>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={isLoading}
              >
                Maybe Later
              </Button>
              <Button
                onClick={handlePaymentAndAnalysis}
                disabled={isLoading || !isConnected}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Get STEDDIE Analysis - $0.25"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                🐢 STEDDIE Analysis Complete
              </DialogTitle>
              <DialogDescription>
                Your premium workout analysis by STEDDIE, powered by Amazon Nova
                Lite
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Score Display */}
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {extractScore(analysisData || "")}
                </div>
                <div className="text-sm text-muted-foreground">/100</div>
              </div>

              {/* Summary */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  {extractSummary(analysisData || "")}
                </p>
              </div>

              {/* Full Analysis in Collapsible */}
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                  View Full Analysis
                </summary>
                <div className="mt-2 p-3 bg-white border rounded-lg max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-gray-700">
                    {analysisData}
                  </pre>
                </div>
              </details>
            </div>

            <DialogFooter>
              <Button onClick={handleCloseModal} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PremiumAnalysisUpsell;
