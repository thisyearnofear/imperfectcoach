import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { baseSepolia } from "wagmi/chains";
import { trackPaymentTransaction, updateTransactionStatus } from "@/lib/cdp";
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
// Removed x402-fetch import due to wallet interface conflicts

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
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "verified" | "settled" | "complete"
  >("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  // Base (EVM) wallet
  const { isConnected: isBaseConnected } = useAccount();
  const { data: walletClient } = useWalletClient({
    chainId: baseSepolia.id,
  });
  
  // Solana wallet
  const { publicKey: solanaPublicKey, signMessage: solanaSignMessage, connected: isSolanaConnected } = useWallet();
  
  // Determine which wallet is connected based on preferred chain
  const isConnected = preferredChain === 'solana' ? isSolanaConnected : isBaseConnected;

  const handlePaymentAndAnalysis = async () => {
    if (!isConnected) {
      setError(`Please connect your ${preferredChain === 'solana' ? 'Solana' : 'Base'} wallet to proceed.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPaymentStatus("processing");

    try {
      let address: string;
      let signature: string;
      let message: string;
      const timestamp = Date.now();

      // Handle Solana wallet
      if (preferredChain === 'solana') {
        if (!solanaPublicKey || !solanaSignMessage) {
          throw new Error("Solana wallet not properly connected");
        }
        
        address = solanaPublicKey.toBase58();
        message = `Authorize payment of 0.05 USDC for premium workout analysis\nTimestamp: ${timestamp}\nAddress: ${address}`;
        
        console.log("✍️ Signing Solana payment authorization...");
        const encodedMessage = new TextEncoder().encode(message);
        const signatureBytes = await solanaSignMessage(encodedMessage);
        signature = Buffer.from(signatureBytes).toString('base64');
        console.log("✅ Solana payment authorization signed");
      } 
      // Handle Base (EVM) wallet
      else {
        if (!walletClient) {
          throw new Error("Base wallet not properly connected");
        }
        
        address = walletClient.account?.address;
        if (!address) {
          throw new Error("No wallet address found");
        }
        
        message = `Authorize payment of 0.05 USDC for premium workout analysis\nTimestamp: ${timestamp}\nAddress: ${address}`;
        
        console.log("✍️ Signing Base payment authorization...");
        signature = await walletClient.signMessage({
          account: address,
          message,
        });
        console.log("✅ Base payment authorization signed");
      }

      console.log("🚀 Starting premium analysis with x402 payment...");
      console.log("💪 Workout data:", JSON.stringify(workoutData, null, 2));
      console.log(`🔗 Using ${preferredChain} chain for payment`);

      setPaymentStatus("verified");

      const apiUrl =
        "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout";

      const requestBody = {
        workoutData,
        payment: {
          walletAddress: address,
          signature,
          message,
          amount: "50000",
          timestamp,
        },
      };

      console.log(
        "💳 Making initial request to check for payment requirements..."
      );

      // First, make a request without payment to get the 402 challenge
      let response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // If we get a 402 Payment Required, handle the x402 flow manually
      if (response.status === 402) {
        console.log("💰 Payment required - processing x402 payment...");

        const paymentChallenge = await response.json();
        console.log("🎯 Payment challenge received:", paymentChallenge);

        // Extract payment requirements - support both old 'accepts' and new 'schemes' format
        const availableSchemes = paymentChallenge.accepts || paymentChallenge.schemes;
        if (!availableSchemes || availableSchemes.length === 0) {
          throw new Error(
            "Invalid payment challenge - no payment requirements found"
          );
        }
        
        // Select payment requirement based on preferred chain
        let paymentRequirement;
        if (preferredChain === 'solana') {
          // Find Solana payment option
          paymentRequirement = availableSchemes.find((scheme: any) => 
            scheme.network?.includes('solana')
          );
          if (!paymentRequirement) {
            console.warn('⚠️ Solana payment not available, falling back to Base');
            paymentRequirement = availableSchemes[0];
          }
        } else {
          // Find Base payment option
          paymentRequirement = availableSchemes.find((scheme: any) => 
            scheme.network?.includes('base') || scheme.network?.includes('ethereum')
          ) || availableSchemes[0];
        }
        
        // Determine actual chain from selected requirement
        const chain = paymentRequirement.network?.includes('solana') ? 'solana' : 'base';
        console.log(`🔗 Selected ${chain} payment scheme`);
        
        // Create payment payload with payer field for Lambda compatibility
        const paymentPayload = {
          scheme: paymentRequirement.scheme,
          network: paymentRequirement.network,
          asset: paymentRequirement.asset,
          amount: paymentRequirement.amount,
          chainId: paymentRequirement.chainId,
          payTo: paymentRequirement.payTo,
          payer: address, // Use 'payer' field that Lambda expects
          from: address,
          timestamp: Date.now(),
          nonce: crypto.randomUUID(),
          signature: signature, // Use the wallet signature we already have
          message: message, // Include the original message that was signed
        };

        // Encode payment payload as base64 for x402 header
        const paymentHeader = btoa(JSON.stringify(paymentPayload));
        console.log("📦 Created x402 payment header");

        setPaymentStatus("settled");

        // Retry the request with the x402 payment header AND chain header
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Payment": paymentHeader,
            "X-Chain": chain, // Add chain header to route correctly
          },
          body: JSON.stringify(requestBody),
        });
      }

      console.log("📡 x402 response status:", response.status);
      console.log(
        "📋 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("❌ x402 payment error response:", errorText);
        throw new Error(
          `Analysis failed with status ${response.status}: ${errorText}`
        );
      }

      setPaymentStatus("settled");

      // Parse analysis result
      let analysisResult;
      try {
        const responseText = await response.text();
        console.log("📄 Response length:", responseText.length);

        analysisResult = JSON.parse(responseText);
        console.log("✅ Analysis result parsed:", analysisResult);
      } catch (parseError) {
        console.error("💥 Failed to parse response:", parseError);
        throw new Error(`Invalid response format: ${parseError.message}`);
      }

      // Handle transaction hash from response
      if (analysisResult.transactionHash) {
        const txHash = analysisResult.transactionHash;
        setTransactionHash(txHash);

        // Track the payment transaction with enhanced metadata
        trackPaymentTransaction(
          txHash,
          "0.05", // amount
          "USDC", // currency
          "Premium workout analysis", // description
          "x402 payment protocol" // facilitator
        );

        console.log("📝 Payment transaction tracked:", txHash);
      }

      setPaymentStatus("complete");
      setAnalysisData(analysisResult.analysis);
      setShowResults(true);
      onAnalysisComplete(analysisResult);
    } catch (err: unknown) {
      console.error("💥 Premium Analysis Error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      setPaymentStatus("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowResults(false);
    setAnalysisData(null);
    setError(null);
    setPaymentStatus("idle");
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
                  Payment goes directly to RevenueSplitter contract on Base
                  Sepolia
                </li>
              </ul>
            </div>

            {/* Payment Status Indicator */}
            {paymentStatus !== "idle" && (
              <div className="my-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  {paymentStatus === "processing" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span>Processing payment...</span>
                    </>
                  )}
                  {paymentStatus === "verified" && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Payment verified, analyzing workout...</span>
                    </>
                  )}
                  {paymentStatus === "settled" && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Payment settled, generating analysis...</span>
                    </>
                  )}
                  {paymentStatus === "complete" && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Analysis complete!</span>
                    </>
                  )}
                </div>
                {transactionHash && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <a
                      href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      View transaction <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
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
                    {paymentStatus === "processing" && "Processing Payment..."}
                    {paymentStatus === "verified" && "Payment Verified..."}
                    {paymentStatus === "settled" && "Analyzing Workout..."}
                    {paymentStatus === "complete" && "Complete!"}
                    {paymentStatus === "idle" && "Processing..."}
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
