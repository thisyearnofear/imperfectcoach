import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { trackPaymentTransaction } from "@/lib/cdp";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Badge } from "@/components/ui/badge";
import { SkeletonPaymentStatus } from "@/components/ui/enhanced-skeleton";
import {
  Loader2,
  Brain,
  CheckCircle,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Target,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import {
  CoachModel,
  RepData,
  Exercise,
  SessionSummaries,
  ChatMessage,
} from "@/lib/types";
import PerformanceAnalytics from "./PerformanceAnalytics";

interface WorkoutData {
  exercise: string;
  reps: number;
  averageFormScore: number;
  repHistory: Array<{
    score: number;
    details?: Record<string, unknown>;
  }>;
  duration?: number;
}

interface BedrockAnalysisResult {
  analysis: string;
  score?: number;
  recommendations?: string[];
  transactionHash?: string;
}

interface BedrockAnalysisSectionProps {
  workoutData: WorkoutData;
  onAnalysisComplete?: (result: BedrockAnalysisResult) => void;
  onFollowUpQuery?: (query: string, model: CoachModel) => Promise<string>;
  remainingQueries?: number;
  // Performance Analytics props
  repHistory?: RepData[];
  exercise?: Exercise;
  sessionDuration?: string;
  repTimings?: { avg: number; stdDev: number };
  sessionSummaries?: SessionSummaries | null;
  isSummaryLoading?: boolean;
  chatMessages?: ChatMessage[];
  isChatLoading?: boolean;
  onSendMessage?: (message: string, model: CoachModel) => Promise<void>;
  onUpgrade?: () => void;
  onTryAgain?: () => void;
}

const BedrockAnalysisSection = ({
  workoutData,
  onAnalysisComplete,
  onFollowUpQuery,
  remainingQueries = 3,
  repHistory = [],
  exercise = "jumps",
  sessionDuration = "N/A",
  repTimings = { avg: 0, stdDev: 0 },
  sessionSummaries = null,
  isSummaryLoading = false,
  chatMessages = [],
  isChatLoading = false,
  onSendMessage,
  onUpgrade,
  onTryAgain,
}: BedrockAnalysisSectionProps) => {
  const { addPremiumSession } = usePremiumAccess();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<BedrockAnalysisResult | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "verified" | "settled" | "complete"
  >("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const [showAnalytics, setShowAnalytics] = useState(false);

  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient({
    chainId: baseSepolia.id,
  });

  const handlePremiumAnalysis = async () => {
    if (!isConnected || !walletClient) {
      setError("Please connect your wallet to proceed.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPaymentStatus("processing");

    try {
      const address = walletClient.account?.address;
      if (!address) {
        throw new Error("No wallet address found");
      }

      // Create payment authorization
      const timestamp = Date.now();
      const message = `Authorize payment of 0.05 USDC for premium workout analysis\nTimestamp: ${timestamp}\nAddress: ${address}`;

      const signature = await walletClient.signMessage({
        account: address,
        message,
      });

      setPaymentStatus("verified");

      // Convert duration to seconds
      const convertDurationToSeconds = (durationString: string): number => {
        if (!durationString || durationString === "N/A") return 0;
        const minMatch = durationString.match(/(\d+)m/);
        const secMatch = durationString.match(/(\d+)s/);
        const minutes = minMatch ? parseInt(minMatch[1]) : 0;
        const seconds = secMatch ? parseInt(secMatch[1]) : 0;
        return minutes * 60 + seconds;
      };

      const requestBody = {
        workoutData: {
          ...workoutData,
          duration: convertDurationToSeconds(
            workoutData.duration?.toString() || "0"
          ),
        },
        payment: {
          walletAddress: address,
          signature,
          message,
          amount: "50000", // 0.05 USDC in microUSDC
          timestamp,
        },
      };

      const apiUrl =
        "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout";

      // First, make a request without payment to get the 402 challenge
      let response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      // If we get a 402 Payment Required, handle the x402 flow manually
      if (response.status === 402) {
        console.log("💰 Payment required - processing x402 payment...");

        const paymentChallenge = await response.json();
        console.log("🎯 Payment challenge received:", paymentChallenge);

        // Extract payment requirements
        const paymentRequirement = paymentChallenge.accepts?.[0];
        if (!paymentRequirement) {
          throw new Error(
            "Invalid payment challenge - no payment requirements found"
          );
        }

        // Create x402 payment payload with correct structure
        const paymentTimestamp = Math.floor(Date.now() / 1000);
        const paymentNonce = crypto.randomUUID();

        // Create payment message for x402 signature
        const x402Message = `x402 Payment Authorization
Scheme: ${paymentRequirement.scheme}
Network: ${paymentRequirement.network}
Asset: ${paymentRequirement.asset}
Amount: ${paymentRequirement.amount}
PayTo: ${paymentRequirement.payTo}
Payer: ${address}
Timestamp: ${paymentTimestamp}
Nonce: ${paymentNonce}`;

        console.log("🖊️ Signing x402 payment message...");

        // Generate new signature specifically for x402 payment
        const x402Signature = await walletClient.signMessage({
          account: address,
          message: x402Message,
        });

        console.log("✅ x402 payment signature generated");

        // Create the payment payload in exact x402 format
        const paymentPayload = {
          scheme: paymentRequirement.scheme,
          network: paymentRequirement.network,
          asset: paymentRequirement.asset,
          amount: paymentRequirement.amount,
          payTo: paymentRequirement.payTo,
          payer: address,
          timestamp: paymentTimestamp,
          nonce: paymentNonce,
          signature: x402Signature,
          message: x402Message,
        };

        // Encode payment payload as base64 for x402 header
        const paymentHeader = btoa(JSON.stringify(paymentPayload));
        console.log("📦 Created x402 payment header with real signature");

        setPaymentStatus("settled");

        // Retry the request with the x402 payment header
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Payment": paymentHeader,
          },
          body: JSON.stringify(requestBody),
        });
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `Analysis failed with status ${response.status}: ${errorText}`
        );
      }

      setPaymentStatus("settled");

      const result = await response.json();

      if (result.transactionHash) {
        setTransactionHash(result.transactionHash);
        trackPaymentTransaction(
          result.transactionHash,
          "0.05",
          "USDC",
          "Premium workout analysis",
          "Bedrock Nova Analysis"
        );
      }

      setPaymentStatus("complete");
      setAnalysisResult(result);

      // Add premium session when analysis is successful
      if (result.transactionHash) {
        addPremiumSession(result.transactionHash, "0.05", "USDC");
      }

      onAnalysisComplete?.(result);
    } catch (err) {
      console.error("Premium Analysis Error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      setPaymentStatus("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const extractScore = (analysis: string): string => {
    const scoreMatch = analysis.match(/Score:\s*(\d+)\/100|(\d+)\/100/);
    return scoreMatch ? scoreMatch[1] || scoreMatch[2] : "85";
  };

  const extractKeyInsights = (analysis: string): string[] => {
    const lines = analysis.split("\n").filter((line) => line.trim());
    const insights: string[] = [];

    for (const line of lines) {
      if (line.includes("•") || line.includes("-") || line.includes("*")) {
        const cleaned = line.replace(/^[•\-*\s]+/, "").trim();
        if (cleaned.length > 10) {
          insights.push(cleaned);
        }
      }
    }

    return insights.slice(0, 3); // Top 3 insights
  };

  // Render purchase/processing interface if no analysis yet
  if (!analysisResult) {
    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800 justify-center">
            <Brain className="h-6 w-6" />
            Amazon Bedrock Nova Deep Dive
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-800"
            >
              Premium
            </Badge>
          </CardTitle>
          <p className="text-purple-700 text-sm text-center">
            In depth analysis powered by Amazon's advanced AI
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-purple-800 font-medium">
                Advanced biomechanical analysis
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-purple-800 font-medium">
                Personalized improvement plan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-purple-800 font-medium">
                3 follow-up queries with AI coaches
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span className="text-purple-800 font-medium">
                Permanent on-chain record
              </span>
            </div>
          </div>

          {/* Payment Status Indicator */}
          {paymentStatus !== "idle" && (
            <div className="my-4">
              {paymentStatus === "processing" && <SkeletonPaymentStatus />}
              {paymentStatus !== "processing" && (
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    {paymentStatus === "verified" && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-800 font-medium">
                          Payment verified, analyzing workout...
                        </span>
                      </>
                    )}
                    {paymentStatus === "settled" && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-800 font-medium">
                          Payment settled, generating analysis...
                        </span>
                      </>
                    )}
                    {paymentStatus === "complete" && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-800 font-medium">
                          Analysis complete!
                        </span>
                      </>
                    )}
                  </div>
                  {transactionHash && (
                    <div className="mt-2 text-xs">
                      <a
                        href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 text-blue-700 hover:text-blue-800"
                      >
                        View transaction <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <AnimatedButton
            onClick={handlePremiumAnalysis}
            disabled={isLoading || !isConnected}
            disableAnimation={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            animationPreset="glow"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {paymentStatus === "processing" && "Processing Payment..."}
                {paymentStatus === "verified" && "Payment Verified..."}
                {paymentStatus === "settled" && "Analyzing Workout..."}
                {paymentStatus === "complete" && "Complete!"}
                {(paymentStatus === "idle" || !paymentStatus) &&
                  "Processing..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Unlock Bedrock Analysis - $0.05
              </>
            )}
          </AnimatedButton>
        </CardContent>
      </Card>
    );
  }

  // Show analysis results
  if (analysisResult) {
    const score = extractScore(analysisResult.analysis);
    const insights = extractKeyInsights(analysisResult.analysis);

    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800 justify-center">
            <Brain className="h-6 w-6" />
            Amazon Bedrock Nova Analysis
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="text-center p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
            <div className="text-4xl font-bold text-purple-700">{score}</div>
            <div className="text-purple-600 font-medium">Bedrock Score</div>
          </div>

          {/* Full Analysis Collapsible */}
          <div className="text-center">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-purple-600 hover:text-purple-800 mb-2">
                View Complete Analysis
              </summary>
              <div className="p-4 bg-white border border-purple-200 rounded-lg max-h-80 overflow-y-auto text-left">
                <pre className="whitespace-pre-wrap text-xs text-gray-700 font-mono">
                  {analysisResult.analysis}
                </pre>
              </div>
            </details>
          </div>

          {/* Performance Charts Toggle - Premium Feature */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowAnalytics(!showAnalytics)}
              size="sm"
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showAnalytics ? "Hide" : "Show"} Performance Charts
            </Button>

            {showAnalytics && onTryAgain && (
              <div className="mt-4">
                <PerformanceAnalytics
                  repHistory={repHistory}
                  totalReps={workoutData.reps}
                  averageFormScore={workoutData.averageFormScore}
                  exercise={exercise}
                  sessionDuration={sessionDuration}
                  repTimings={repTimings}
                  sessionSummaries={sessionSummaries}
                  isSummaryLoading={isSummaryLoading}
                  onTryAgain={onTryAgain}
                  chatMessages={chatMessages}
                  isChatLoading={isChatLoading}
                  onSendMessage={onSendMessage || (() => Promise.resolve())}
                  onUpgrade={onUpgrade}
                  remainingQueries={remainingQueries}
                  isPremiumContext={true}
                />
              </div>
            )}
          </div>

          {transactionHash && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t border-purple-200">
              <a
                href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 hover:text-blue-600"
              >
                Verified on blockchain <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default BedrockAnalysisSection;
