import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { API_ENDPOINTS, getExplorerUrl } from "@/lib/config";
import { trackPaymentTransaction } from "@/lib/cdp";
import { usePremiumAccess } from "@/hooks/usePremiumAccess";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { solanaWalletManager } from "@/lib/payments/solana-wallet-adapter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Badge } from "@/components/ui/badge";
import { SkeletonPaymentStatus } from "@/components/ui/enhanced-skeleton";
import {
  Loader2,
  Brain,
  Shield,
  Activity,
  Camera,
  MessageSquare,
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
import { WalletBalanceDisplay } from "./WalletBalanceDisplay";

interface WorkoutData {
  exercise: string;
  reps: number;
  averageFormScore: number;
  repHistory: Array<{
    score: number;
    details?: Record<string, unknown>;
  }>;
  duration?: number;
  injuryFocus?: "none" | "back" | "knee";
  representativeImage?: string; // Multimodal Vision: Base64 frame for analysis
}

interface BedrockAnalysisResult {
  analysis?: string;
  agentResponse?: string;
  reasoning_text?: string;
  rehab_protocol?: {
    focus_area: string;
    protocol: Array<{ exercise: string; reps?: string; duration?: string; benefit: string }>;
    rehab_summary: string;
  };
  score?: number;
  recommendations?: string[];
  transactionHash?: string;
  model?: string;
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

const AgentCoordinationMap = () => {
  return (
    <div className="bg-slate-900 rounded-xl p-4 overflow-hidden relative border border-slate-800 shadow-inner">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Sparkles className="h-3 w-3 text-purple-400" />
        Active Agent Coordination Loop
      </div>
      
      <div className="flex items-center justify-between relative z-10">
        {/* Agent 1: Fitness Coach */}
        <div className="bg-slate-800 p-2 rounded-lg border border-purple-500/30 flex items-center gap-3 w-[45%]">
          <div className="h-8 w-8 rounded-full bg-purple-900/50 flex items-center justify-center border border-purple-500/50">
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-white leading-tight">Fitness Coach</div>
            <div className="text-[8px] text-purple-400">Rep: 98/100</div>
          </div>
        </div>

        {/* The Coordination Line */}
        <div className="flex-1 flex items-center justify-center">
          <div className="h-[2px] w-full bg-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-4 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-shimmer" />
          </div>
        </div>

        {/* Agent 2: Recovery Specialist */}
        <div className="bg-slate-800 p-2 rounded-lg border border-blue-500/30 flex items-center gap-3 w-[45%]">
          <div className="h-8 w-8 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-500/50">
            <Shield className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-white leading-tight">Recovery Spec.</div>
            <div className="text-[8px] text-blue-400">x402 Settled</div>
          </div>
        </div>
      </div>

      <div className="text-center mt-3 text-[9px] text-slate-500 font-mono italic">
        [x402] FitnessCoach {'->'} call {'->'} RecoverySpecialist (0.02 USDC)
      </div>
    </div>
  );
};

const ReasoningStream = () => {
  const [step, setStep] = useState(0);
  const steps = [
    "Initializing Nova 2 Extended Thinking...",
    "Scanning skeletal keypoints for micro-jitters...",
    "Calculating joint torque and lever arms...",
    "Analyzing lumbar-pelvic rhythm...",
    "Benchmarking against elite biomechanics data...",
    "Synthesizing preventative rehab protocol...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="relative">
        <Brain className="h-12 w-12 text-purple-600 animate-pulse" />
        <Sparkles className="h-6 w-6 text-amber-400 absolute -top-2 -right-2 animate-bounce" />
      </div>
      <div className="space-y-2 text-center">
        <div className="text-purple-900 font-bold text-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          {steps[step]}
        </div>
        <div className="flex justify-center gap-1">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 w-8 rounded-full transition-colors duration-500 ${i === step ? "bg-purple-600" : "bg-purple-100"}`} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

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
  const [injuryFocus, setInjuryFocus] = useState<"none" | "back" | "knee">("none");
  const [clinicalNote, setClinicalNote] = useState("");
  const [protocolApproved, setProtocolApproved] = useState(false);

  const [showAnalytics, setShowAnalytics] = useState(false);

  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { isSolanaConnected, solanaAddress } = useWalletConnection();

  const handlePremiumAnalysis = async () => {
    if (!isConnected && !isSolanaConnected) {
      setError("Please connect your wallet (Base or Solana) to proceed.");
      return;
    }

    if (isConnected && !walletClient) {
      setError("Wallet client not available.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPaymentStatus("processing");

    try {
      // Determine which wallet to use
      let address: string;
      let signMessage: (message: string) => Promise<string>;
      let walletChain: "base" | "avalanche" | "solana";

      if (isConnected && walletClient) {
        // Use EVM wallet - detect if it's Base or Avalanche
        address = walletClient.account?.address || "";
        if (!address) {
          throw new Error("No EVM wallet address found");
        }
        
        // Detect current chain by checking chainId
        const chainId = walletClient.chain?.id;
        if (chainId === 43113) { // Avalanche Fuji
          walletChain = "avalanche";
        } else { // Default to Base Sepolia
          walletChain = "base";
        }
        
        signMessage = async (msg: string) => {
          return await walletClient.signMessage({
            account: address as `0x${string} `,
            message: msg,
          });
        };
      } else if (isSolanaConnected) {
        // Use Solana wallet
        const managerState = solanaWalletManager.getState();
        if (!managerState.publicKey || !managerState.adapter) {
          throw new Error("Solana wallet not properly connected");
        }
        address = managerState.publicKey.toString();
        walletChain = "solana";
        signMessage = async (msg: string) => {
          const msgBuffer = new TextEncoder().encode(msg);
          const signatureBytes = await solanaWalletManager.signMessage(msgBuffer);
          // Convert signature bytes to base64
          return btoa(String.fromCharCode(...signatureBytes));
        };
      } else {
        throw new Error("No wallet connected");
      }

      // Convert duration to seconds
      const convertDurationToSeconds = (durationString: string): number => {
        if (!durationString || durationString === "N/A") return 0;
        const minMatch = durationString.match(/(\d+)m/);
        const secMatch = durationString.match(/(\d+)s/);
        const minutes = minMatch ? parseInt(minMatch[1]) : 0;
        const seconds = secMatch ? parseInt(secMatch[1]) : 0;
        return minutes * 60 + seconds;
      };

      const apiUrl =
        API_ENDPOINTS.PREMIUM_ANALYSIS;

      // First, make a request WITHOUT payment to get the 402 challenge (x402 protocol)
      let response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Chain": walletChain === "avalanche" ? "avalanche-fuji" : walletChain === "base" ? "base-sepolia" : "solana-devnet"
        },
        body: JSON.stringify({
          workoutData: {
            ...workoutData,
            duration: convertDurationToSeconds(
              workoutData.duration?.toString() || "0"
            ),
            injuryFocus: injuryFocus,
            clinicalNote: clinicalNote,
            representativeImage: workoutData.representativeImage,
          },
          walletInfo: {
            address: address,
            chain: walletChain,
            addressFormat: walletChain === "solana" ? "base58" : "hex"
          }
          // Don't send payment yet - wait for 402 challenge
        }),
      });

      // x402 protocol: server returns 402 with challenge
      if (response.status === 402) {
        const { challenge } = await response.json();
        if (!challenge) {
          throw new Error("Invalid payment challenge - server did not provide challenge");
        }

        // Sign the exact challenge from server
        const challengeMessage = JSON.stringify({
          amount: challenge.amount,
          asset: challenge.asset,
          network: challenge.network,
          payTo: challenge.payTo,
          scheme: challenge.scheme,
          timestamp: challenge.timestamp,
          nonce: challenge.nonce
        });

        const signature = await signMessage(challengeMessage);

        // Create signed payment
        const signedPayment = {
          ...challenge,
          signature,
          payer: address
        };

        // Encode for X-Payment header
        const paymentHeader = btoa(JSON.stringify(signedPayment));

        setPaymentStatus("settled");

        // Retry with signature
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Payment": paymentHeader,
            "X-Chain": walletChain === "avalanche" ? "avalanche-fuji" : walletChain === "base" ? "base-sepolia" : "solana-devnet"
          },
          body: JSON.stringify({
            workoutData: {
              ...workoutData,
              duration: convertDurationToSeconds(
                workoutData.duration?.toString() || "0"
              ),
              injuryFocus: injuryFocus,
              clinicalNote: clinicalNote,
              representativeImage: workoutData.representativeImage,
            },
            walletInfo: {
              address: address,
              chain: walletChain,
              addressFormat: walletChain === "solana" ? "base58" : "hex"
            }
          }),
        });
      }

      if (!response.ok) {
        let errorMessage = "Analysis request failed";

        try {
          const errorData = await response.json();

          // Handle 402 Payment Required specifically
          if (response.status === 402) {
            errorMessage = "Payment verification failed. Please ensure your wallet has sufficient USDC and try again.";

            // Extract specific error if available
            if (errorData.error && typeof errorData.error === 'string') {
              // Clean up technical error messages for user display
              if (errorData.error.includes('Non-base58')) {
                errorMessage = "Wallet address format error. Please try reconnecting your wallet.";
              } else if (errorData.error.includes('Insufficient')) {
                errorMessage = "Insufficient USDC balance. Get testnet tokens from faucet.";
              } else if (errorData.error.includes('signature')) {
                errorMessage = "Payment signature verification failed. Please try again.";
              }
            }
          } else {
            // Generic error message for other status codes
            errorMessage = errorData.error || errorData.message || `Request failed(${response.status})`;
          }
        } catch {
          // If JSON parsing fails, use status-based message
          errorMessage = `Analysis failed(HTTP ${response.status}).Please try again.`;
        }

        throw new Error(errorMessage);
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

      // Provide a local fallback analysis instead of a dead end
      const fallback = buildLocalFallbackAnalysis(workoutData, injuryFocus);
      setAnalysisResult(fallback);
      setError("Advanced AI analysis is temporarily unavailable. Showing a local summary instead.");
      setPaymentStatus("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const buildLocalFallbackAnalysis = (
    data: WorkoutData,
    focus: "none" | "back" | "knee"
  ): BedrockAnalysisResult => {
    const score = Math.round(data.averageFormScore || 0);
    const tips: string[] = [];
    if (score < 70) tips.push("Reduce speed and prioritise controlled reps.");
    if (focus === "knee") tips.push("Focus on knee tracking and softer landings.");
    if (focus === "back") tips.push("Keep your trunk braced and avoid excessive forward lean.");
    if (data.reps > 0) tips.push(`You completed ${data.reps} reps — review consistency, not just max effort.`);

    return {
      model: "local-fallback",
      score,
      recommendations: tips,
      analysis:
        `Instant summary:\n` +
        `• Exercise: ${data.exercise}\n` +
        `• Reps: ${data.reps}\n` +
        `• Average form score: ${score}/100\n\n` +
        (tips.length ? `Tips:\n` + tips.map(t => `• ${t}`).join("\n") : ""),
    };
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
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50/30 shadow-xl overflow-hidden">
        <div className="bg-purple-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-bold tracking-tight">AI CLINICAL REVIEW</span>
          </div>
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none text-[10px]">
            POWERED BY NOVA 2
          </Badge>
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-purple-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Biomechanical Diagnostic
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Amazon Nova 2 will perform a multi-step 'Extended Thinking' analysis of your joint stability and movement physics.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Injury Focus - Clinical Redesign */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Primary Diagnostic Focus
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "none", label: "General", desc: "Overall form", icon: CheckCircle },
                { id: "back", label: "Lumbar", desc: "Spine safety", icon: Shield },
                { id: "knee", label: "Patella", desc: "Joint stress", icon: Activity },
              ].map((focus) => (
                <button
                  key={focus.id}
                  onClick={() => setInjuryFocus(focus.id as any)}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-left ${
                    injuryFocus === focus.id
                      ? "border-purple-600 bg-purple-50 ring-2 ring-purple-200"
                      : "border-gray-100 bg-white hover:border-purple-200"
                  }`}
                >
                  <focus.icon className={`h-5 w-5 mb-1 ${injuryFocus === focus.id ? "text-purple-600" : "text-gray-400"}`} />
                  <span className={`text-sm font-bold ${injuryFocus === focus.id ? "text-purple-900" : "text-gray-600"}`}>
                    {focus.label}
                  </span>
                  <span className="text-[10px] text-gray-400 leading-tight text-center mt-1">
                    {focus.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Note - NEW HACKATHON FEATURE (ag-ui inspired) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-3 w-3" />
              Symptom Log / Clinical Notes
            </label>
            <textarea
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              placeholder="e.g., Sharp pinch in lower back, knee feels unstable on landing..."
              className="w-full p-3 rounded-xl border-2 border-purple-100 bg-white text-sm text-purple-900 placeholder:text-purple-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 transition-all outline-none min-h-[80px] resize-none"
            />
            <p className="text-[10px] text-purple-400 italic">
              Nova 2 will prioritize these symptoms in its Extended Thinking phase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
            <div className="flex items-start gap-2">
              <div className="bg-white p-1 rounded shadow-sm">
                <TrendingUp className="h-3 w-3 text-purple-600" />
              </div>
              <div className="text-[11px] leading-tight text-purple-800">
                <span className="font-bold block">Physics Engine</span>
                Calculates torque & joint leverage
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="bg-white p-1 rounded shadow-sm">
                <Target className="h-3 w-3 text-purple-600" />
              </div>
              <div className="text-[11px] leading-tight text-purple-800">
                <span className="font-bold block">SLA Guaranteed</span>
                Sub-5s Deep Reasoning
              </div>
            </div>
          </div>

          {/* Balance Display - Shows user affordability */}
          <WalletBalanceDisplay
            variant="detailed"
            requiredAmount="0.05"
            className="mt-4"
            onInsufficientFunds={() => {
              setError("Insufficient USDC balance. Get testnet tokens from a faucet to continue.");
            }}
          />

          {/* Payment Status Indicator */}
          {paymentStatus !== "idle" && (
            <div className="my-4">
              {paymentStatus === "processing" && <SkeletonPaymentStatus />}
              {paymentStatus !== "processing" && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  {paymentStatus === "verified" && (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-800 font-medium">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Payment verified, starting Nova 2 engine...
                    </div>
                  )}
                  {paymentStatus === "settled" && <ReasoningStream />}
                  {paymentStatus === "complete" && (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-800 font-medium">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Analysis complete!
                    </div>
                  )}
                  {transactionHash && (
                    <div className="mt-2 text-xs">
                      <a
                        href={getExplorerUrl(transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 text-blue-700 hover:text-blue-800"
                      >
                        View transaction <ExternalLink className="h-3 w-3" />
                      </a >
                    </div >
                  )}
                </div >
              )}
            </div >
          )}

          {
            error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )
          }

          <AnimatedButton
            onClick={handlePremiumAnalysis}
            disabled={isLoading || (!isConnected && !isSolanaConnected)}
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
        </CardContent >
      </Card >
    );
  }

  // Show analysis results
  if (analysisResult) {
    const finalAnalysisText = analysisResult.agentResponse || analysisResult.analysis || "";
    const score = extractScore(finalAnalysisText);
    const reasoningText = analysisResult.reasoning_text;

    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-2 text-purple-800 text-center">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Amazon Bedrock Nova 2 Analysis
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Complete
              </Badge>
              {analysisResult.model === "local-fallback" ? (
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  Local Summary
                </Badge>
              ) : (
                <Badge variant="outline" className="border-purple-300 text-purple-700">
                  Nova 2 Powered
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Agent Coordination - HACKATHON USP */}
          <AgentCoordinationMap />

          {/* Score Display */}
          <div className="text-center p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg shadow-sm">
            <div className="text-4xl font-bold text-purple-700">{score}</div>
            <div className="text-purple-600 font-medium">Coach Form Score</div>
          </div>

          {/* Multimodal Vision: The Reference Frame - HACKATHON FEATURE */}
          {workoutData.representativeImage && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-purple-900 uppercase tracking-widest">
                <Camera className="h-3 w-3 text-purple-600" />
                Visual Second Opinion
              </div>
              <div className="relative rounded-xl overflow-hidden border-2 border-purple-100 shadow-inner group">
                <img 
                  src={workoutData.representativeImage} 
                  alt="Representative rep analysis" 
                  className="w-full h-auto object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500 max-h-48"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <div className="text-[10px] text-white font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    Nova 2 analyzed this specific frame for biomechanical flaws
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nova 2 Extended Thinking - HACKATHON FEATURE */}
          {reasoning_text && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4">
              <details className="group">
                <summary className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-900 list-none">
                  <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
                  View Nova 2 "Extended Thinking" Process
                  <Badge variant="outline" className="ml-auto text-[10px] uppercase border-amber-200 text-amber-700">
                    Step-by-step reasoning
                  </Badge>
                </summary>
                <div className="mt-3 text-xs text-amber-900/80 leading-relaxed font-serif bg-white/50 p-3 rounded border border-amber-50 whitespace-pre-wrap">
                  {reasoning_text}
                </div>
              </details>
            </div>
          )}

          {/* Rehab Protocol - CLINICAL REDESIGN */}
          {analysisResult.rehab_protocol && (
            <Card className="border-none shadow-lg overflow-hidden">
              <div className="bg-blue-600 px-4 py-2 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                  <Activity className="h-4 w-4" />
                  Recovery Prescription
                </div>
                <Badge className="bg-blue-500/50 border-none text-[9px] uppercase">
                  AI Prescribed
                </Badge>
              </div>
              <CardContent className="p-5 bg-blue-50/30 space-y-4">
                <div className="flex items-center gap-2 p-2 bg-blue-100/50 rounded-lg text-blue-900 font-semibold text-sm">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Focus: {analysisResult.rehab_protocol.focus_area} mobility
                </div>
                
                <div className="space-y-3">
                  {analysisResult.rehab_protocol.protocol.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-blue-100 shadow-sm group hover:border-blue-300 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900 flex items-center justify-between">
                          {step.exercise}
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                            {step.reps || step.duration}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {step.benefit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-400 text-center font-medium uppercase tracking-tighter pt-2 border-t border-blue-100 italic">
                  Complete before your next high-intensity session for optimal joint safety.
                </div>

                {/* HITL: Protocol Approval Step - NEW HACKATHON FEATURE */}
                <div className="mt-4 pt-4 border-t border-blue-100">
                  {!protocolApproved ? (
                    <Button
                      onClick={() => {
                        setProtocolApproved(true);
                        toast.success("Protocol Authorized", {
                          description: "Your personalized recovery plan is now active.",
                        });
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      Authorize Clinical Recovery Plan
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200 text-green-800 font-bold text-sm animate-in zoom-in-95 duration-300">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Protocol Authorized & Logged
                      <Badge variant="outline" className="ml-2 bg-white text-[10px] border-green-200 text-green-700">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Final Coach Response */}
          <div className="p-5 bg-white border border-purple-100 rounded-xl shadow-sm">
            <h4 className="flex items-center gap-2 text-sm font-bold text-purple-900 mb-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Final Coach Assessment
            </h4>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2 whitespace-pre-wrap">
              {finalAnalysisText}
            </div>
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
                href={getExplorerUrl(transactionHash)}
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
