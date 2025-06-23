import { useState } from "react";
import { useAccount, useConnectorClient } from "wagmi";
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Trophy } from "lucide-react";

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

  const handlePaymentAndAnalysis = async () => {
    if (!isConnected || !walletClient) {
      setError("Please connect your wallet to proceed.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call AWS Lambda directly with x402 payment
      const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient);

      const apiUrl =
        "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout";

      console.log("Calling AWS Lambda directly for premium analysis...");
      console.log("Request payload:", JSON.stringify(workoutData, null, 2));

      const response = await fetchWithPayment(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "identity", // Disable compression
        },
        body: JSON.stringify(workoutData),
      });

      console.log("Lambda response status:", response.status);
      console.log(
        "Lambda response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Lambda error response:", errorText);
        throw new Error(
          `Analysis failed with status ${response.status}: ${errorText}`
        );
      }

      // Check content type and handle response appropriately
      const contentType = response.headers.get("content-type");
      const contentEncoding = response.headers.get("content-encoding");
      console.log("Lambda response content-type:", contentType);
      console.log("Lambda response content-encoding:", contentEncoding);

      let analysisResult;
      try {
        const responseText = await response.text();
        console.log("Lambda raw response length:", responseText.length);
        console.log(
          "Lambda raw response preview:",
          responseText.substring(0, 500)
        );

        // Try to parse as JSON
        analysisResult = JSON.parse(responseText);
        console.log("Successfully parsed Lambda response:", analysisResult);
      } catch (parseError) {
        console.error("Failed to parse Lambda response as JSON:", parseError);
        console.error("Parse error details:", parseError.message);
        throw new Error(
          `Invalid response format from analysis service: ${parseError.message}`
        );
      }

      // Check for x-payment-response header
      const paymentResponseHeader = response.headers.get("x-payment-response");
      if (paymentResponseHeader) {
        try {
          const paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
          console.log("Payment successful:", paymentResponse);
        } catch (paymentError) {
          console.log(
            "Payment header parsing error (using mock mode):",
            paymentError
          );
          console.log("Payment completed (mock payment mode)");
        }
      } else {
        console.log("Analysis completed (mock payment mode)");
      }

      console.log("About to set analysis data:", analysisResult.analysis);
      setAnalysisData(analysisResult.analysis);
      setShowResults(true);
      console.log("About to call onAnalysisComplete with:", analysisResult);
      onAnalysisComplete(analysisResult);
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
              <DialogTitle>Unlock Your Full Potential</DialogTitle>
              <DialogDescription>
                Get a permanent on-chain record and a "Bedrock Deep Dive"
                analysis of your workout for just $0.25.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4">
              <p className="font-semibold">What you'll get:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>In-depth form analysis powered by Amazon Bedrock.</li>
                <li>Actionable insights to improve your technique.</li>
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
                  "Pay $0.25 and Analyze"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Analysis Complete
              </DialogTitle>
              <DialogDescription>
                Your premium workout analysis powered by Amazon Bedrock
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
