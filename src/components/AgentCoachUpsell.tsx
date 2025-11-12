import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { trackPaymentTransaction } from "@/lib/cdp";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, Zap, Target, TrendingUp, Lock, Sparkles, Eye, CheckCircle2, AlertCircle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { solanaWalletManager } from "@/lib/payments/solana-wallet-adapter";

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
  const [error, setError] = useState<{title: string, message: string} | null>(null);
  const { toast } = useToast();
  
  const clearError = () => {
    setError(null);
  };
  
  // Wallet integration - support both EVM and Solana
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: baseSepolia.id });
  const { solanaAddress, isSolanaConnected } = useSolanaWallet();
  
  // Determine which wallet is connected
  const walletAddress = address || solanaAddress;
  const walletConnected = isConnected || isSolanaConnected;
  const walletChain = isConnected ? "base" : isSolanaConnected ? "solana" : undefined;

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

    try {
      // Simulate agent reasoning progress for UX
      const progressSteps = [
        { step: "Processing payment...", progress: 15, tools: [] },
        { step: "Agent analyzing workout data...", progress: 30, tools: [] },
        { step: "Examining pose patterns...", progress: 45, tools: ["analyze_pose_data"] },
        { step: "Querying your workout history...", progress: 60, tools: ["analyze_pose_data", "query_workout_history"] },
        { step: "Benchmarking performance...", progress: 75, tools: ["analyze_pose_data", "query_workout_history", "benchmark_performance"] },
        { step: "Generating personalized plan...", progress: 90, tools: ["analyze_pose_data", "query_workout_history", "benchmark_performance", "generate_training_plan"] },
        { step: "Synthesizing insights...", progress: 95, tools: ["analyze_pose_data", "query_workout_history", "benchmark_performance", "generate_training_plan"] },
      ];

      // Start progress simulation
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          const current = progressSteps[stepIndex];
          setCurrentStep(current.step);
          setProgress(current.progress);
          setActiveTools(current.tools);
          stepIndex++;
        }
      }, 2000);

      // Prepare request body with agent mode
      const timestamp = Math.floor(Date.now() / 1000);
      const requestBody = {
        workoutData: {
          ...workoutData,
          userId: workoutData.userId || walletAddress,
        },
        agentMode: true, // Enable real agent functionality
        payment: {
          walletAddress: walletAddress,
          signature: "placeholder", // Will be replaced with x402 signature
          message: "I authorize payment for AI Agent analysis",
          amount: "100000", // $0.10 USDC
          timestamp,
          chain: walletChain,
        },
      };

      const apiUrl = "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout";

      // First, make a request WITHOUT payment data to get the 402 challenge
      // This is the x402 pattern - server tells us what payment it needs
      let response = await fetch(apiUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Chain": walletChain || "base" // Tell server which chain we're using
        },
        body: JSON.stringify({
          workoutData: {
            ...workoutData,
            userId: workoutData.userId || walletAddress,
          },
          agentMode: true,
          // Don't send payment yet - wait for 402 challenge
        }),
      });

      // If we get a 402 Payment Required, handle the x402 flow
      if (response.status === 402) {
        console.log("💰 Payment required - processing x402 payment for agent...");

        const paymentChallenge = await response.json();
        console.log("🎯 Agent payment challenge received:", paymentChallenge);

        // Extract payment requirements - support both old 'accepts' and new 'schemes' format
        const paymentRequirement = paymentChallenge.accepts?.[0] || paymentChallenge.schemes?.[0];
        if (!paymentRequirement) {
          throw new Error("Invalid payment challenge - no payment requirements found");
        }

        // Create x402 payment payload
        const paymentTimestamp = Math.floor(Date.now() / 1000);
        const paymentNonce = crypto.randomUUID();

        // Create payment message for x402 signature
        const x402Message = `x402 Payment Authorization
Scheme: ${paymentRequirement.scheme}
Network: ${paymentRequirement.network}
Asset: ${paymentRequirement.asset}
Amount: ${paymentRequirement.amount}
PayTo: ${paymentRequirement.payTo}
Payer: ${walletAddress}
Timestamp: ${paymentTimestamp}
Nonce: ${paymentNonce}`;

        console.log("🖊️ Signing x402 payment message for agent...");

        // Generate signature for x402 payment based on wallet type
        let x402Signature: string;
        
        if (walletChain === "solana" && isSolanaConnected) {
          // Solana wallet signature using solanaWalletManager
          const managerState = solanaWalletManager.getState();
          if (!managerState.publicKey || !managerState.adapter) {
            throw new Error("Solana wallet not properly connected");
          }
          
          const messageBytes = new TextEncoder().encode(x402Message);
          const signatureBytes = await solanaWalletManager.signMessage(messageBytes);
          // Convert signature bytes to base64 for Solana
          x402Signature = btoa(String.fromCharCode(...signatureBytes));
        } else if (walletClient && address) {
          // EVM wallet signature
          x402Signature = await walletClient.signMessage({
            account: address,
            message: x402Message,
          });
        } else {
          throw new Error("No wallet available for signing");
        }

        console.log("✅ x402 signature generated for agent");

        // Update request body with x402 payment details
        requestBody.payment = {
          walletAddress: walletAddress,
          signature: x402Signature,
          message: x402Message,
          amount: paymentRequirement.amount,
          timestamp: paymentTimestamp,
          nonce: paymentNonce,
          scheme: paymentRequirement.scheme,
          network: paymentRequirement.network,
          asset: paymentRequirement.asset,
          payTo: paymentRequirement.payTo,
          chain: walletChain,
        };

        // Make the actual request with payment in x402 header format
        response = await fetch(apiUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Payment": JSON.stringify({
              signature: x402Signature,
              message: x402Message,
              amount: paymentRequirement.amount,
              timestamp: paymentTimestamp,
              nonce: paymentNonce,
              scheme: paymentRequirement.scheme,
              network: paymentRequirement.network,
              asset: paymentRequirement.asset,
              payTo: paymentRequirement.payTo,
              payer: walletAddress,
            }),
            "X-Chain": walletChain || "base"
          },
          body: JSON.stringify({
            workoutData: {
              ...workoutData,
              userId: workoutData.userId || walletAddress,
            },
            agentMode: true,
          }),
        });
      }

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Agent analysis failed");
      }

      const result = await response.json();
      setProgress(100);
      setCurrentStep("Analysis complete!");
      setAgentAnalysis(result);

      // Track payment transaction if available
      if (result.transactionHash) {
        try {
          await trackPaymentTransaction(result.transactionHash, "agent_analysis");
        } catch (trackingError) {
          console.warn("Failed to track payment transaction:", trackingError);
        }
      }

      toast({
        title: "✅ AI Agent Analysis Complete",
        description: `Used ${result.toolsUsed?.length || 0} tools in ${result.iterationsUsed || 0} reasoning steps`,
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Agent analysis error:", error);
      
      // Enhanced error messaging based on error type
      let title = "Agent Analysis Failed";
      let message = "Unable to process autonomous analysis. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("payment")) {
          title = "Payment Required";
          message = "Please ensure you have sufficient USDC funds for the agent analysis.";
        } else if (error.message.includes("network")) {
          title = "Network Error";
          message = "Unable to connect to the agent service. Please check your connection and try again.";
        } else if (error.message.includes("timeout")) {
          title = "Request Timeout";
          message = "The agent is taking longer than expected. Please try again in a few minutes.";
        } else {
          message = error.message;
        }
      }
      
      // Set error state to show error view
      setError({ title, message });
      
      // Also show toast for immediate feedback
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
  if (isProcessing) {
    return (
      <Card className="border-purple-500/50 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-indigo-900/30 backdrop-blur-sm relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 animate-pulse" />
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400 animate-pulse" />
            AI Coach Agent Thinking
            <Badge variant="outline" className="ml-auto bg-purple-500/20 border-purple-400 animate-pulse">
              <Sparkles className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Autonomous multi-step analysis in progress...
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 relative">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-300 font-medium">{currentStep}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 transition-all duration-500 ease-out" />
            {progress > 0 && progress < 100 && (
              <div className="flex justify-center">
                <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
            )}
          </div>

          {/* Active Tools Visualization */}
          {activeTools.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-purple-300">
                <Eye className="h-4 w-4" />
                Watch the Agent Work:
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "analyze_pose_data", label: "Form Analysis", icon: Target, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
                  { name: "query_workout_history", label: "History Check", icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
                  { name: "benchmark_performance", label: "Benchmarking", icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
                  { name: "generate_training_plan", label: "Plan Creation", icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
                ].map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTools.includes(tool.name);
                  
                  return (
                    <div
                      key={tool.name}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-500 transform",
                        isActive
                          ? `${tool.bg} shadow-lg shadow-purple-500/20 scale-105 animate-pulse`
                          : "border-gray-700 bg-gray-800/30 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={cn(
                            "h-5 w-5 transition-all duration-300",
                            isActive ? `${tool.color} animate-pulse` : "text-gray-500"
                          )}
                        />
                        <div className="flex-1">
                          <span className="text-xs font-medium">{tool.label}</span>
                          {isActive && (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="h-1 w-1 bg-green-400 rounded-full animate-ping"></div>
                              <span className="text-[10px] text-green-400">Executing...</span>
                            </div>
                          )}
                        </div>
                        {isActive && (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
                            <CheckCircle2 className="h-3 w-3 text-green-400 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agent Info */}
          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-purple-300">Autonomous Decision-Making</p>
                <p className="text-xs text-muted-foreground">
                  The agent is independently deciding which tools to use and how to analyze your workout. No human intervention required.
                </p>
                <div className="flex items-center gap-2 text-xs text-purple-400/80 mt-2">
                  <div className="h-2 w-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>Agent is actively reasoning...</span>
                </div>
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
              Autonomous
            </Badge>
          </CardTitle>
          <CardDescription>
            Multi-step reasoning with {agentAnalysis.toolsUsed?.length || 0} tool calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Agent Response */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {agentAnalysis.agentResponse}
            </div>
          </div>

          {/* Tools Used */}
          {agentAnalysis.toolsUsed && agentAnalysis.toolsUsed.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                Tools Used by Agent
              </h4>
              <div className="flex flex-wrap gap-2">
                {agentAnalysis.toolsUsed.map((tool: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tool.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning Steps Timeline */}
          {agentAnalysis.reasoning_steps && agentAnalysis.reasoning_steps.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-400" />
                Autonomous Reasoning Chain
              </h4>
              <div className="space-y-3">
                {agentAnalysis.reasoning_steps.map((step: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                      {step.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-purple-300">
                            {step.action.replace(/_/g, " ")}
                          </span>
                          <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
                            Completed
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
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold">Model:</span> {agentAnalysis.model}
            </div>
            <div>
              <span className="font-semibold">Iterations:</span> {agentAnalysis.iterationsUsed}
            </div>
            <div className="col-span-2">
              <span className="font-semibold">AgentCore Primitives:</span>{" "}
              {agentAnalysis.agentCore_primitives_used?.join(", ")}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-500/50 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-indigo-900/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-500/20">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle>AI Coach Agent</CardTitle>
              <p className="text-sm text-muted-foreground">Autonomous multi-step reasoning</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border-purple-400 text-purple-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Autonomous
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Value Proposition */}
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Brain className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Multi-Step Reasoning</h4>
              <p className="text-xs text-muted-foreground">
                Agent autonomously decides which analysis tools to use and synthesizes insights with real Bedrock AgentCore
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Tool Integration</h4>
              <p className="text-xs text-muted-foreground">
                Accesses pose analysis, workout history, benchmarks, and training plan generation with real tool execution
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Target className="h-4 w-4 text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Personalized Plans</h4>
              <p className="text-xs text-muted-foreground">
                Creates adaptive training programs based on your unique performance patterns
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Autonomous Decisions</h4>
              <p className="text-xs text-muted-foreground">
                Agent independently determines analysis strategy with real Bedrock AgentCore primitives
              </p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">$0.10</span>
                <span className="text-sm text-muted-foreground">USDC</span>
              </div>
              <p className="text-xs text-muted-foreground">One-time payment per analysis</p>
            </div>
          </div>

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
                Agent Analyzing...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Unlock AI Coach Agent
              </>
            )}
          </AnimatedButton>
        </div>

        {/* Tech Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <Lock className="h-3 w-3 inline mr-1" />
          Powered by Amazon Bedrock AgentCore • Real multi-step reasoning • Actual tool use
        </div>
      </CardContent>
    </Card>
  );
}
