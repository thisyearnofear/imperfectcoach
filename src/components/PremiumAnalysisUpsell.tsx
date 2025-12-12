import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { trackPaymentTransaction } from "@/lib/cdp";
import { PaymentRouter, PaymentResult } from "@/lib/payments/payment-router";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { API_ENDPOINTS } from "@/lib/config";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Trophy, ExternalLink, CheckCircle } from "lucide-react";

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
  preferredChain?: 'base' | 'solana'; // Optional: specify which chain to use
}

const PremiumAnalysisUpsell = ({
  isOpen,
  onOpenChange,
  workoutData,
  onAnalysisComplete,
  preferredChain = 'base',
}: PremiumAnalysisUpsellProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [analysisData, setAnalysisData] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Base (EVM) wallet
  const { isConnected: isBaseConnected, address: baseAddress } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Solana wallet (via centralized hook)
  const { isSolanaConnected } = useWalletConnection();

  // Determine if we can proceed based on preferred chain
  const isConnected = preferredChain === 'solana' ? isSolanaConnected : isBaseConnected;

  const handlePaymentAndAnalysis = async () => {
    if (!isConnected) {
      setError(`Please connect your ${preferredChain === 'solana' ? 'Solana' : 'Base'} wallet to proceed.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setTransactionHash(null);

    try {
      console.log("🚀 Starting premium analysis via PaymentRouter...");

      const result: PaymentResult = await PaymentRouter.execute({
        apiUrl: API_ENDPOINTS.PREMIUM_ANALYSIS,
        requestBody: {
          workoutData,
          // Legacy support: some endpoints might expect 'payment' object initially, 
          // but x402 handles it via headers. We send minimal placeholder if needed.
          payment: {
            walletAddress: baseAddress || "solana-user",
            timestamp: Date.now()
          }
        },
        evmWallet: walletClient,
        evmAddress: baseAddress,
        preferredChain: preferredChain
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Analysis failed to complete");
      }

      console.log("✅ Analysis complete:", result.data);

      const analysisResult = result.data;

      // Handle transaction hash from response
      if (result.transactionHash) {
        setTransactionHash(result.transactionHash);

        // Track the payment transaction 
        trackPaymentTransaction(
          result.transactionHash,
          "0.05",
          "USDC",
          "Premium workout analysis",
          "x402 payment protocol"
        );
      }

      setAnalysisData(analysisResult.analysis);
      setShowResults(true);
      onAnalysisComplete(analysisResult);

    } catch (err: unknown) {
      console.error("💥 Premium Analysis Error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowResults(false);
    setAnalysisData(null);
    setError(null);
    setTransactionHash(null);
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
                analysis of your workout for just $0.05.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4">
              <p className="font-semibold">What you'll get:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>
                  In-depth form analysis powered by Amazon Bedrock Nova Lite
                </li>
                <li>Actionable insights to improve your technique</li>
                <li>
                  Your "WIP Passport" NFT will be minted or updated on-chain
                </li>
                <li>A permanent, verifiable record of your progress</li>
                <li>
                  Payment settled via x402 on your preferred chain
                </li>
              </ul>
            </div>

            {/* Status Indicator */}
            {isLoading && (
              <div className="my-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Processing secure x402 payment & analyzing...</span>
                </div>
              </div>
            )}

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
                  "Pay $0.05 USDC & Analyze"
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

              {/* Transaction Link */}
              {transactionHash && (
                <div className="p-2 bg-green-50/50 border border-green-100 rounded text-center">
                  <a
                    href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:underline flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Payment Verified on Blockchain
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

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
