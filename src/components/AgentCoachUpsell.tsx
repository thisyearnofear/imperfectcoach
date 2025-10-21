import { useState, useEffect } from "react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Brain, Zap, Target, TrendingUp, Lock, Sparkles, Eye, CheckCircle2, AlertCircle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const { toast } = useToast();

  const handleUnlockAgent = async () => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep("Initializing AI Coach Agent...");

    try {
      // Simulate agent reasoning progress for UX
      const progressSteps = [
        { step: "Agent analyzing workout data...", progress: 20, tools: [] },
        { step: "Examining pose patterns...", progress: 35, tools: ["analyze_pose_data"] },
        { step: "Querying your workout history...", progress: 55, tools: ["analyze_pose_data", "query_workout_history"] },
        { step: "Benchmarking performance...", progress: 70, tools: ["analyze_pose_data", "query_workout_history", "benchmark_performance"] },
        { step: "Generating personalized plan...", progress: 85, tools: ["analyze_pose_data", "query_workout_history", "benchmark_performance", "generate_training_plan"] },
        { step: "Synthesizing insights...", progress: 95, tools: ["analyze_pose_data", "query_workout_history", "benchmark_performance", "generate_training_plan"] },
      ];

      // Call the AI Agent Lambda endpoint
      const responsePromise = fetch(
        "https://YOUR_AGENT_API_ENDPOINT.execute-api.eu-north-1.amazonaws.com/agent-coach",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workoutData: {
              ...workoutData,
              userId: workoutData.userId || "demo-user",
            },
          }),
        }
      );

      // Show progress steps while waiting
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          const current = progressSteps[stepIndex];
          setCurrentStep(current.step);
          setProgress(current.progress);
          setActiveTools(current.tools);
          stepIndex++;
        }
      }, 1500);

      const response = await responsePromise;
      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error("Agent analysis failed");
      }

      const result = await response.json();
      setProgress(100);
      setCurrentStep("Analysis complete!");
      setAgentAnalysis(result);

      toast({
        title: "✅ AI Agent Analysis Complete",
        description: `Used ${result.toolsUsed?.length || 0} tools in ${result.iterationsUsed || 0} reasoning steps`,
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Agent analysis error:", error);
      toast({
        title: "❌ Agent Analysis Failed",
        description: "Unable to process autonomous analysis. Please try again.",
        variant: "destructive",
      });
      setProgress(0);
      setCurrentStep("");
    } finally {
      setIsProcessing(false);
    }
  };

  // Processing view with live feedback
  if (isProcessing) {
    return (
      <Card className="border-purple-500/50 bg-gradient-to-br from-purple-950/20 to-blue-950/20 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 animate-pulse" />
        
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
            <Progress value={progress} className="h-2" />
          </div>

          {/* Active Tools Visualization */}
          {activeTools.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-purple-300">
                <Eye className="h-4 w-4" />
                Watch the Agent Work:
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "analyze_pose_data", label: "Form Analysis", icon: Target },
                  { name: "query_workout_history", label: "History Check", icon: TrendingUp },
                  { name: "benchmark_performance", label: "Benchmarking", icon: Trophy },
                  { name: "generate_training_plan", label: "Plan Creation", icon: Brain },
                ].map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTools.includes(tool.name);
                  return (
                    <div
                      key={tool.name}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all duration-300",
                        isActive
                          ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                          : "border-gray-700 bg-gray-800/30 opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            isActive ? "text-green-400 animate-pulse" : "text-gray-500"
                          )}
                        />
                        <span className="text-xs font-medium">{tool.label}</span>
                        {isActive && <CheckCircle2 className="h-3 w-3 ml-auto text-green-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agent Info */}
          <div className="bg-purple-950/30 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-purple-300">Autonomous Decision-Making</p>
                <p className="text-xs text-muted-foreground">
                  The agent is independently deciding which tools to use and how to analyze your workout. No human intervention required.
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
      <Card className="border-purple-500/50 bg-gradient-to-br from-purple-950/20 to-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            AI Coach Agent Analysis
            <Badge variant="outline" className="ml-auto">
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

          {/* Reasoning Steps */}
          {agentAnalysis.reasoning_steps && agentAnalysis.reasoning_steps.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-400" />
                Autonomous Reasoning Chain
              </h4>
              <div className="space-y-2">
                {agentAnalysis.reasoning_steps.map((step: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-mono">
                      {step.step}
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold text-blue-300">
                        {step.action.replace(/_/g, " ")}
                      </span>
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
    <Card className="border-purple-500/50 bg-gradient-to-br from-purple-950/20 to-blue-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-400" />
            <CardTitle>AI Coach Agent</CardTitle>
          </div>
          <Badge variant="outline" className="bg-purple-500/20 border-purple-400 text-purple-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Autonomous
          </Badge>
        </div>
        <CardDescription>
          Advanced multi-step reasoning with tool integration
        </CardDescription>
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
                Agent autonomously decides which analysis tools to use and synthesizes insights
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
                Accesses pose analysis, workout history, benchmarks, and training plan generation
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
                Agent independently determines analysis strategy without manual intervention
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
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
          Powered by Amazon Bedrock AgentCore • Multi-step reasoning • Tool use
        </div>
      </CardContent>
    </Card>
  );
}
