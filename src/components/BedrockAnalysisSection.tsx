import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { trackPaymentTransaction } from "@/lib/cdp";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Brain,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Target,
  AlertCircle,
} from "lucide-react";
import { CoachModel } from "@/lib/types";

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
}

const BedrockAnalysisSection = ({
  workoutData,
  onAnalysisComplete,
  onFollowUpQuery,
  remainingQueries = 3,
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
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [queryResults, setQueryResults] = useState<
    Array<{
      query: string;
      model: CoachModel;
      response: string;
    }>
  >([]);
  const [queryingModel, setQueryingModel] = useState<CoachModel | null>(null);

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

      const response = await fetch(
        "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

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

  const handleFollowUpQuery = async (model: CoachModel) => {
    if (!followUpQuery.trim() || !onFollowUpQuery || remainingQueries <= 0)
      return;

    setQueryingModel(model);
    try {
      const response = await onFollowUpQuery(followUpQuery, model);
      setQueryResults((prev) => [
        ...prev,
        {
          query: followUpQuery,
          model,
          response,
        },
      ]);
      setFollowUpQuery("");
    } catch (error) {
      console.error("Follow-up query error:", error);
    } finally {
      setQueryingModel(null);
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
              <MessageSquare className="h-4 w-4 text-purple-600" />
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
            <div className="my-4 p-3 bg-blue-50 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 text-sm">
                {paymentStatus === "processing" && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-blue-800 font-medium">
                      Processing payment...
                    </span>
                  </>
                )}
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

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <Button
            onClick={handlePremiumAnalysis}
            disabled={isLoading || !isConnected}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
          </Button>
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

          <Separator />

          {/* Follow-up Queries Section */}
          <div className="text-center">
            <h4 className="font-semibold text-purple-800 mb-3 flex items-center justify-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Ask AI Coaches
              <Badge variant="outline" className="text-xs">
                {remainingQueries} queries left
              </Badge>
            </h4>

            {remainingQueries > 0 && (
              <div className="space-y-3">
                <textarea
                  value={followUpQuery}
                  onChange={(e) => setFollowUpQuery(e.target.value)}
                  placeholder="Ask a specific question about your analysis..."
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  {(["gemini", "openai", "anthropic"] as CoachModel[]).map(
                    (model) => (
                      <Button
                        key={model}
                        onClick={() => handleFollowUpQuery(model)}
                        disabled={
                          !followUpQuery.trim() || queryingModel !== null
                        }
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        {queryingModel === model ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        {model.charAt(0).toUpperCase() + model.slice(1)}
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Query Results */}
            {queryResults.length > 0 && (
              <div className="space-y-3 mt-4">
                {queryResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {result.model.charAt(0).toUpperCase() +
                          result.model.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        "{result.query}"
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{result.response}</p>
                  </div>
                ))}
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
