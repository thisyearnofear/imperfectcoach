import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ServiceTierSelector } from "./ServiceTierSelector";
import { AgentServiceBrowser } from "./AgentServiceBrowser";
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { ServiceTier, AgentCapability, AgentProfile } from "@/lib/agents/types";
import { PaymentRouter, RoutingContext } from "@/lib/payments/payment-router";
import { API_ENDPOINTS } from "@/lib/config";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

type BookingStep = "tier-select" | "agent-select" | "confirm" | "processing" | "complete" | "error";

interface ServiceBookingFlowProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  capability: AgentCapability;
  basePrice: string; // Price in USDC (e.g., "0.05")
  onBookingComplete?: (booking: any) => void;
  preferredChain?: "base" | "solana";
}

interface BookingState {
  selectedTier: ServiceTier | null;
  selectedAgent: AgentProfile | null;
  transactionHash: string | null;
  errorMessage: string | null;
}

export const ServiceBookingFlow = ({
  isOpen,
  onOpenChange,
  capability,
  basePrice,
  onBookingComplete,
  preferredChain = "base",
}: ServiceBookingFlowProps) => {
  const [step, setStep] = useState<BookingStep>("tier-select");
  const [booking, setBooking] = useState<BookingState>({
    selectedTier: null,
    selectedAgent: null,
    transactionHash: null,
    errorMessage: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Wallets
  const { isConnected: isBaseConnected, address: baseAddress } = useAccount();
  const { data: walletClient } = useWalletClient({
    chainId: baseSepolia.id,
  });
  const { isSolanaConnected } = useSolanaWallet();

  const isConnected = preferredChain === "solana" ? isSolanaConnected : isBaseConnected;

  const handleTierSelect = (tier: ServiceTier) => {
    setBooking((prev) => ({ ...prev, selectedTier: tier }));
    setStep("agent-select");
  };

  const handleAgentSelect = (agent: AgentProfile) => {
    setBooking((prev) => ({ ...prev, selectedAgent: agent }));
    setStep("confirm");
  };

  const handleConfirmBooking = async () => {
    if (!booking.selectedTier || !booking.selectedAgent) {
      setBooking((prev) => ({
        ...prev,
        errorMessage: "Missing tier or agent selection",
      }));
      setStep("error");
      return;
    }

    if (!isConnected) {
      setBooking((prev) => ({
        ...prev,
        errorMessage: `Please connect your ${
          preferredChain === "solana" ? "Solana" : "Base"
        } wallet to proceed.`,
      }));
      setStep("error");
      return;
    }

    setStep("processing");
    setIsProcessing(true);
    setBooking((prev) => ({ ...prev, errorMessage: null }));

    try {
      console.log(
        `📅 Booking Flow: Starting ${booking.selectedTier} tier booking for agent ${booking.selectedAgent.id}`
      );

      // Prepare payment context
      const context: RoutingContext = {
        apiUrl: `${API_ENDPOINTS.AGENT_DISCOVERY}/agents/${booking.selectedAgent.id}/book`,
        requestBody: {
          capability,
          tier: booking.selectedTier,
          agentId: booking.selectedAgent.id,
          requestData: {
            walletAddress: baseAddress || "solana-user",
            timestamp: Date.now(),
          },
        },
        evmWallet: walletClient,
        evmAddress: baseAddress,
        preferredChain,
      };

      // Execute payment via standard x402 flow
      const result = await PaymentRouter.execute(context);

      if (!result.success) {
        throw new Error(result.error || "Booking failed");
      }

      console.log("✅ Booking complete:", result.data);

      // Update state with success
      setBooking((prev) => ({
        ...prev,
        transactionHash: result.transactionHash || null,
      }));

      // Notify parent
      if (onBookingComplete) {
        onBookingComplete(result.data);
      }

      setStep("complete");
    } catch (error: unknown) {
      console.error("❌ Booking Error:", error);
      const errorMsg =
        error instanceof Error ? error.message : "An unknown error occurred";
      setBooking((prev) => ({
        ...prev,
        errorMessage: errorMsg,
      }));
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep("tier-select");
    setBooking({
      selectedTier: null,
      selectedAgent: null,
      transactionHash: null,
      errorMessage: null,
    });
    onOpenChange(false);
  };

  const getTierPrice = (tier: ServiceTier): string => {
    const { TIER_PRICE_MULTIPLIERS } = require("@/lib/agents/service-tiers");
    const baseNum = parseFloat(basePrice);
    const multiplier = TIER_PRICE_MULTIPLIERS[tier];
    return (baseNum * multiplier).toFixed(4);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-screen overflow-y-auto">
        {/* Tier Selection */}
        {step === "tier-select" && (
          <>
            <DialogHeader>
              <DialogTitle>Book a Service</DialogTitle>
              <DialogDescription>
                Choose your service tier for {capability}
              </DialogDescription>
            </DialogHeader>

            <div className="my-4">
              <ServiceTierSelector
                basePrice={basePrice}
                selectedTier={booking.selectedTier || "basic"}
                onTierSelect={handleTierSelect}
                disabled={!isConnected}
              />
            </div>

            {!isConnected && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4" />
                Please connect your wallet to continue
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => handleTierSelect(booking.selectedTier || "basic")}
                disabled={!isConnected}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Agent Selection */}
        {step === "agent-select" && booking.selectedTier && (
          <>
            <DialogHeader>
              <DialogTitle>Select an Agent</DialogTitle>
              <DialogDescription>
                Choose from available {booking.selectedTier} tier agents
              </DialogDescription>
            </DialogHeader>

            <div className="my-4">
              <AgentServiceBrowser
                capability={capability}
                tier={booking.selectedTier}
                basePrice={basePrice}
                onAgentSelected={handleAgentSelect}
                selectedAgentId={booking.selectedAgent?.id}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("tier-select")}>
                Back
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={!booking.selectedAgent}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Confirmation */}
        {step === "confirm" &&
          booking.selectedTier &&
          booking.selectedAgent && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm Booking</DialogTitle>
                <DialogDescription>
                  Review your booking details before proceeding
                </DialogDescription>
              </DialogHeader>

              <Card className="my-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agent:</span>
                    <span className="font-semibold">
                      {booking.selectedAgent.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-semibold">{capability}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tier:</span>
                    <Badge variant="outline">
                      {booking.selectedTier.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-baseline">
                    <span className="text-gray-600">Total Cost:</span>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">
                        ${getTierPrice(booking.selectedTier)}
                      </p>
                      <p className="text-xs text-gray-500">USDC</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!isConnected && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  Please connect your wallet to proceed
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("agent-select")}>
                  Back
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={isProcessing || !isConnected}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay & Book`
                  )}
                </Button>
              </DialogFooter>
            </>
          )}

        {/* Processing */}
        {step === "processing" && (
          <>
            <DialogHeader>
              <DialogTitle>Processing Booking</DialogTitle>
            </DialogHeader>

            <div className="my-8 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <div className="text-center space-y-2">
                <p className="font-semibold">Creating your booking...</p>
                <p className="text-xs text-gray-500">
                  Please approve the transaction in your wallet
                </p>
              </div>
            </div>
          </>
        )}

        {/* Complete */}
        {step === "complete" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Booking Confirmed
              </DialogTitle>
            </DialogHeader>

            <Card className="my-4 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Agent</p>
                    <p className="text-lg font-semibold">
                      {booking.selectedAgent?.name}
                    </p>
                  </div>

                  {booking.transactionHash && (
                    <div className="p-3 bg-white border border-green-200 rounded-lg">
                      <a
                        href={`https://sepolia.basescan.org/tx/${booking.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:underline flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        View on Blockchain
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 text-center">
                    Your booking is active. The agent will begin processing
                    your request.
                  </p>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Error */}
        {step === "error" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Booking Failed
              </DialogTitle>
            </DialogHeader>

            <Card className="my-4 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm text-red-800">{booking.errorMessage}</p>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("confirm")}
                disabled={step === "tier-select"}
              >
                Back
              </Button>
              <Button onClick={() => setStep("confirm")}>Try Again</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
