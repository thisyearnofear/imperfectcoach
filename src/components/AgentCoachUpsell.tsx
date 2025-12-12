import { useState, useEffect, useMemo } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { trackPaymentTransaction } from "@/lib/cdp";
import { PaymentRouter, PaymentResult } from "@/lib/payments/payment-router";
import { API_ENDPOINTS } from "@/lib/config";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, Zap, Target, TrendingUp, Lock, Sparkles, Eye, CheckCircle2, AlertCircle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { solanaWalletManager } from "@/lib/payments/solana-wallet-adapter";
import { WalletBalanceDisplay } from "./WalletBalanceDisplay";

// Agent Economy Components & Types
import {
  AgentContributionList,
  AgentCoordinationProgress,
  AgentValueProposition
} from "./agent-economy";
import {
  AgentCoordinationResult,
  ContributionStatus
} from "@/lib/agents/types";
import {
  createInitialCoordinationState,
  getRandomProcessingMessage,
  AGENT_PROFILES,
  formatNetworkName
} from "@/lib/agents/profiles";
import {
  getSpecialists,
  getAgent,
  CORE_AGENTS,
  type CoreAgent
} from "@/lib/agents/core-agents";

interface AgentCoachUpsellProps {
  workoutData: {
    exercise: string;
    reps: number;
    formScore: number;
    poseData: any;
    userId?: string;
  };
  onSuccess?: (analysis: any) => void;
}

export function AgentCoachUpsell({ workoutData, onSuccess }: AgentCoachUpsellProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentAnalysis, setAgentAnalysis] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [error, setError] = useState<{ title: string, message: string } | null>(null);
  const { toast } = useToast();

  // Agent Economy State - tracks multi-agent coordination
  const [coordination, setCoordination] = useState<AgentCoordinationResult | null>(null);

  const clearError = () => {
    setError(null);
  };

  // Wallet integration - support both EVM and Solana
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { solanaAddress, isSolanaConnected } = useWalletConnection();

  // Determine which wallet is connected and the actual chain
  const walletAddress = address || solanaAddress;
  const walletConnected = isConnected || isSolanaConnected;
  
  // Detect actual chain for EVM wallets
  let walletChain = isSolanaConnected ? "solana" : undefined;
  if (isConnected && walletClient?.chain) {
    const chainId = walletClient.chain.id;
    if (chainId === 43113) { // Avalanche Fuji
      walletChain = "avalanche";
    } else if (chainId === 84532) { // Base Sepolia
      walletChain = "base";
    }
  }

  const handleUnlockAgent = async () => {
    if (!walletConnected || !walletAddress) {
      toast({
        title: "❌ Wallet Required",
        description: "Please connect your Ethereum or Solana wallet to access AI Agent coaching.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCurrentStep("Initializing AI Coach Agent...");

    // Determine network for agent economy
    const networkId = walletChain === 'solana' ? 'solana-devnet' : walletChain === 'avalanche' ? 'avalanche-c-chain' : 'base-sepolia';

    // Initialize agent coordination state
    const initialCoordination = createInitialCoordinationState(networkId);
    setCoordination(initialCoordination);

    try {
      // Generate progress steps dynamically from CORE_AGENTS
      // PRINCIPLE: DRY - Single source of truth for agents and their sequence
      const specialists = getSpecialists();
      const coachAgent = getAgent('agent-fitness-core-01');

      // Build progress steps: payment → coach init → specialists → synthesis
      const progressSteps: Array<{ step: string; progress: number; agentIndex: number; status: ContributionStatus; agent?: CoreAgent }> = [
        { step: "Processing x402 payment...", progress: 10, agentIndex: -1, status: 'processing' },
        { step: `${coachAgent?.emoji} Coach Agent initializing...`, progress: 20, agentIndex: 0, status: 'processing', agent: coachAgent },
      ];

      // Add progress steps for each specialist agent
      const progressPerAgent = Math.floor(70 / (specialists.length + 1)); // Distribute 70% across agents
      specialists.forEach((specialist, idx) => {
        const basePrice = specialist.pricing[specialist.capabilities[0]]?.baseFee || "0.00";
        const repBadge = `${specialist.reputationScore}/100`; // Reputation badge
        progressSteps.push(
          {
            step: `🔍 Discovering ${specialist.name}... [${repBadge}]`,
            progress: 20 + ((idx + 1) * progressPerAgent * 0.3),
            agentIndex: idx + 1,
            status: 'discovering',
            agent: specialist
          },
          {
            step: `💳 Negotiating with ${specialist.name} ($${basePrice})...`,
            progress: 20 + ((idx + 1) * progressPerAgent * 0.6),
            agentIndex: idx + 1,
            status: 'negotiating',
            agent: specialist
          },
          {
            step: `${specialist.emoji} ${specialist.name} analyzing... [${specialist.successRate * 100 | 0}% success]`,
            progress: 20 + ((idx + 1) * progressPerAgent),
            agentIndex: idx + 1,
            status: 'processing',
            agent: specialist
          }
        );
      });

      // Final synthesis step
      progressSteps.push({
        step: "💪 Coach synthesizing insights...",
        progress: 95,
        agentIndex: 0,
        status: 'processing',
        agent: coachAgent
      });

      // Start progress simulation with agent coordination updates
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          const current = progressSteps[stepIndex];
          setCurrentStep(current.step);
          setProgress(current.progress);

          // Update coordination state
          setCoordination(prev => {
            if (!prev) return prev;
            const updated = { ...prev };

            // Mark previous agents as complete
            if (stepIndex > 0) {
              const prevStep = progressSteps[stepIndex - 1];
              if (prevStep.agentIndex === 0) {
                // Coordinator update
                if (updated.coordinator.status !== 'complete') {
                  updated.coordinator = { ...updated.coordinator, status: 'processing' };
                }
              } else if (prevStep.agentIndex > 0) {
                const idx = prevStep.agentIndex - 1;
                if (updated.contributors[idx]) {
                  updated.contributors[idx] = { ...updated.contributors[idx], status: 'complete' };
                }
              }
            }

            // Update current agent status
            if (current.agentIndex === 0) {
              updated.coordinator = {
                ...updated.coordinator,
                status: current.status,
                statusMessage: getRandomProcessingMessage('fitness_coach')
              };
            } else if (current.agentIndex > 0) {
              const idx = current.agentIndex - 1;
              if (updated.contributors[idx]) {
                const agentKey = current.agent?.id || 'agent-fitness-core-01';
                updated.contributors[idx] = {
                  ...updated.contributors[idx],
                  status: current.status,
                  statusMessage: getRandomProcessingMessage(agentKey)
                };
              }
            }

            return updated;
          });

          // Tool tracking - incrementally reveal tools as agents process
          const toolProgression = [
            [], // Payment
            [], // Coach init
            ["analyze_pose_data"], // First specialist
            ["analyze_pose_data", "query_workout_history"], // Second specialist
            ["analyze_pose_data", "query_workout_history", "benchmark_performance"], // Third specialist
            ["analyze_pose_data", "query_workout_history", "benchmark_performance", "generate_training_plan"], // Synthesis
          ];
          setActiveTools(toolProgression[Math.min(stepIndex, toolProgression.length - 1)] || []);

          stepIndex++;
        }
      }, 1500);

      // Execute actual Agent Logic via x402
      console.log("🤖 Starting Autonomous Agent loop via PaymentRouter...");

      // NOTE: We don't need manual x402 challenge/sign/retry logic here anymore!
      // The PaymentRouter handles the negotiation completely.

      const result: PaymentResult = await PaymentRouter.execute({
        apiUrl: API_ENDPOINTS.PREMIUM_ANALYSIS,
        requestBody: {
          workoutData: {
            ...workoutData,
            userId: workoutData.userId || walletAddress,
          },
          agentMode: true, // Enable real agent functionality
          // Placeholder payment object for legacy compatibility
          payment: {
            walletAddress: walletAddress,
            amount: "100000",
            chain: walletChain
          }
        },
        evmWallet: walletClient,
        evmAddress: address, // 'address' from wagmi
        preferredChain: walletChain === 'solana' ? 'solana' : walletChain === 'avalanche' ? 'avalanche' : 'base'
      });

      // Stop the simulation once real result (or error) comes back
      clearInterval(progressInterval);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Agent analysis failed");
      }

      const agentResult = result.data;

      setProgress(100);
      setCurrentStep("Analysis complete!");
      setAgentAnalysis(agentResult);

      // Finalize coordination state - mark all agents as complete
      setCoordination(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'complete',
          endTime: Date.now(),
          coordinator: {
            ...prev.coordinator,
            status: 'complete',
            transactionHash: result.transactionHash,
            result: 'Synthesized personalized training plan'
          },
          contributors: prev.contributors.map((c, i) => ({
            ...c,
            status: 'complete' as ContributionStatus,
            transactionHash: result.transactionHash, // Same tx for all in demo
            result: [
              'Analyzed protein and recovery needs',
              'Evaluated joint angles and form',
              'Planned rest and recovery protocol',
              'Scheduled optimal workout times'
            ][i] || 'Completed analysis'
          }))
        };
      });

      // Track payment transaction if available
      if (result.transactionHash) {
        trackPaymentTransaction(
          result.transactionHash,
          "0.10",
          "USDC",
          "AI Coach Agent analysis",
          "AgentCore x402"
        );
      }

      toast({
        title: "✅ AI Agent Analysis Complete",
        description: `Used ${agentResult.toolsUsed?.length || 0} tools in ${agentResult.iterationsUsed || 0} reasoning steps`,
      });

      if (onSuccess) {
        onSuccess(agentResult);
      }
    } catch (err: unknown) {
      console.error("Agent analysis error:", err);

      // Enhanced error messaging
      let title = "Agent Analysis Failed";
      let message = "Unable to process autonomous analysis. Please try again.";
      const errMessage = err instanceof Error ? err.message : String(err);

      if (errMessage.includes("payment") || errMessage.includes("Payment")) {
        title = "Payment Required";
        message = "Please ensure you have sufficient USDC funds.";
      } else if (errMessage.includes("network")) {
        title = "Network Error";
        message = "Unable to connect to service.";
      } else if (errMessage.includes("timeout")) {
        title = "Request Timeout";
        message = "The agent is taking longer than expected.";
      } else {
        message = errMessage;
      }

      setError({ title, message });

      toast({
        title: `❌ ${title}`,
        description: message,
        variant: "destructive",
      });

      setProgress(0);
      setCurrentStep("");
    } finally {
      setIsProcessing(false);
    }
  };

  // Error view
  if (error) {
    return (
      <Card className="border-red-500/50 bg-gradient-to-br from-red-900/20 to-red-950/30">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            Agent Error
          </CardTitle>
          <CardDescription className="text-center">
            {error.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-4 text-center">
            <p className="text-sm text-red-300">{error.message}</p>
          </div>

          <div className="flex gap-2 justify-center">
            <AnimatedButton
              onClick={clearError}
              className="bg-red-600 hover:bg-red-700"
              size="sm"
            >
              Try Again
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setError(null)}
              variant="outline"
              size="sm"
            >
              Close
            </AnimatedButton>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t text-center">
            <p>If this issue persists, please contact support with the error details above.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Processing view with live feedback
  if (isProcessing && coordination) {
    return (
      <Card className="border-purple-500/50 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-indigo-900/30 backdrop-blur-sm relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 animate-pulse" />

        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400 animate-pulse" />
            Agent Coordination Active
            <Badge variant="outline" className="ml-auto bg-purple-500/20 border-purple-400 animate-pulse">
              <Sparkles className="h-3 w-3 mr-1" />
              {coordination.contributors.filter(c => c.status === 'complete').length + 1}/{coordination.contributors.length + 1}
            </Badge>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            5 specialists coordinating via x402 on {formatNetworkName(coordination.primaryNetwork)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 relative">
          {/* Agent Coordination Progress Component */}
          <AgentCoordinationProgress
            coordination={coordination}
            progress={progress}
            currentStep={currentStep}
          />

          {/* Explanation */}
          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-purple-300">Agent Economy in Action</p>
                <p className="text-xs text-muted-foreground">
                  Your Coach Agent is discovering and paying specialist agents via x402 micropayments.
                  Each agent contributes unique expertise to your personalized training plan.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Results view
  if (agentAnalysis) {
    return (
      <Card className="border-purple-500/50 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-indigo-900/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            AI Coach Agent Analysis
            <Badge variant="outline" className="ml-auto bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border-purple-400">
              <Sparkles className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          </CardTitle>
          <CardDescription>
            {coordination ? `${coordination.contributors.length + 1} agents coordinated` : 'Multi-step reasoning'} • {agentAnalysis.toolsUsed?.length || 0} tool calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Agent Response */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {agentAnalysis.agentResponse}
            </div>
          </div>

          {/* Agent Contribution Breakdown */}
          {coordination && (
            <AgentContributionList
              coordination={coordination}
              showSavings={true}
              showTransaction={true}
            />
          )}

          {/* Reasoning Steps Timeline - Collapsible for cleaner UI */}
          {agentAnalysis.reasoning_steps && agentAnalysis.reasoning_steps.length > 0 && (
            <details className="border-t pt-4">
              <summary className="text-sm font-semibold mb-3 flex items-center gap-2 cursor-pointer hover:text-purple-300 transition-colors">
                <Target className="h-4 w-4 text-blue-400" />
                View Reasoning Chain ({agentAnalysis.reasoning_steps.length} steps)
              </summary>
              <div className="space-y-3 mt-3">
                {agentAnalysis.reasoning_steps.map((step: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                      {step.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-purple-300">
                            {step.action.replace(/_/g, " ")}
                          </span>
                          <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
                            Done
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {step.reasoning || "Tool execution completed"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Tech Metadata - Compact */}
          <div className="border-t pt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span><strong>Model:</strong> {agentAnalysis.model}</span>
            <span><strong>Iterations:</strong> {agentAnalysis.iterationsUsed}</span>
            {agentAnalysis.agentCore_primitives_used?.length > 0 && (
              <span><strong>Primitives:</strong> {agentAnalysis.agentCore_primitives_used.join(", ")}</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine network for display
  const preferredNetwork = walletChain === 'solana' ? 'solana-devnet' : 'avalanche-c-chain';

  return (
    <Card className="border-purple-500/50 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-indigo-900/30 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-500/20">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle>AI Coach Agent</CardTitle>
              <p className="text-sm text-muted-foreground">Powered by x402 Agent Economy</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border-purple-400 text-purple-200">
            <Sparkles className="h-3 w-3 mr-1" />
            {getSpecialists().length} Specialists
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent Value Proposition - Shows what user gets */}
        <AgentValueProposition
          variant="full"
          showNetwork={true}
          network={preferredNetwork}
        />

        {/* Balance Display */}
        <WalletBalanceDisplay
          variant="detailed"
          requiredAmount="0.10"
          className="mb-2"
          onInsufficientFunds={() => {
            toast({
              title: "⚠️ Insufficient USDC",
              description: "Get testnet tokens from faucet to use AI Agent Coach",
              variant: "destructive",
            });
          }}
        />

        {/* CTA Button */}
        <AnimatedButton
          onClick={handleUnlockAgent}
          disabled={isProcessing}
          disableAnimation={isProcessing}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-purple-500/20"
          size="lg"
          animationPreset="glow"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Coordinating Agents...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Unlock {getSpecialists().length + 1} Agents • $0.10
            </>
          )}
        </AnimatedButton>

        {/* Tech Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t flex items-center justify-center gap-2">
          <Lock className="h-3 w-3" />
          <span>Bedrock AgentCore • x402 Protocol • Multi-Chain Settlement</span>
        </div>
      </CardContent>
    </Card>
  );
}

