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
import { Loader2 } from "lucide-react";

interface PremiumAnalysisUpsellProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  workoutData: any; // Replace 'any' with a specific type for workout data
  onAnalysisComplete: (analysis: any) => void;
}

const PremiumAnalysisUpsell = ({
  isOpen,
  onOpenChange,
  workoutData,
  onAnalysisComplete,
}: PremiumAnalysisUpsellProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      // The x402-fetch library requires a viem WalletClient
      const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient);

      const apiUrl =
        "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout";

      const response = await fetchWithPayment(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workoutData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment failed or was rejected.");
      }

      const analysisResult = await response.json();
      const paymentResponse = decodeXPaymentResponse(
        response.headers.get("x-payment-response")!
      );

      console.log("Payment successful:", paymentResponse);
      onAnalysisComplete(analysisResult);
      onOpenChange(false);
    } catch (err: any) {
      console.error("x402 Payment Error:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlock Your Full Potential</DialogTitle>
          <DialogDescription>
            Get a permanent on-chain record and a "Bedrock Deep Dive" analysis
            of your workout for just $0.25.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <p className="font-semibold">What you'll get:</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>In-depth form analysis powered by Amazon Bedrock.</li>
            <li>Actionable insights to improve your technique.</li>
            <li>Your "WIP Passport" NFT will be minted or updated on-chain.</li>
            <li>A permanent, verifiable record of your progress.</li>
          </ul>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
};

export default PremiumAnalysisUpsell;
