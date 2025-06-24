import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Trophy,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  Brain,
  BarChart3,
} from "lucide-react";
import { BlockchainScoreSubmission } from "./BlockchainScoreSubmission";
import { InlineWallet } from "./UnifiedWallet";
import { Leaderboard } from "./Leaderboard";

import { useUserAuth, useUserDisplay } from "@/hooks/useUserHooks";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import {
  Exercise,
  RepData,
  CoachModel,
  SessionSummaries,
  ChatMessage,
} from "@/lib/types";
import PremiumAnalysisUpsell from "./PremiumAnalysisUpsell";
import { cn } from "@/lib/utils";
import { CoachSummarySelector } from "./CoachSummarySelector";
import UnlockedAchievements from "./UnlockedAchievements";
import { useAchievements } from "@/hooks/useAchievements";
import PerformanceAnalytics from "./PerformanceAnalytics";
import { useAIFeedback } from "@/hooks/useAIFeedback";

interface PostWorkoutFlowProps {
  exercise: Exercise;
  reps: number;
  repHistory: RepData[];
  averageFormScore: number;
  onSubmissionComplete?: () => void;
  isWorkoutActive?: boolean;
  hasWorkoutEnded?: boolean;
  sessionDuration?: string;
}

type FlowState = "results" | "connect" | "authenticate" | "ready" | "submitted";

export const PostWorkoutFlow = ({
  exercise,
  reps,
  repHistory,
  averageFormScore,
  onSubmissionComplete,
  isWorkoutActive = false,
  hasWorkoutEnded = false,
  sessionDuration = "N/A",
}: PostWorkoutFlowProps) => {
  const { isConnected, isAuthenticated } = useUserAuth();
  const { basename } = useUserDisplay();
  const { achievements } = useAchievements(reps, repHistory, averageFormScore);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: string;
  } | null>(null);

  // AI Analysis state
  const [selectedCoaches, setSelectedCoaches] = useState<CoachModel[]>([
    "gemini",
  ]);
  const [sessionSummaries, setSessionSummaries] =
    useState<SessionSummaries | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  const canShowSummary = useFeatureGate("AI_SUMMARY");
  const canShowAchievements = useFeatureGate("ACHIEVEMENTS");
  const canShowAnalytics = useFeatureGate("FULL_ANALYTICS");

  // Initialize AI feedback hook
  const { getAISessionSummary, getAIChatResponse } = useAIFeedback({
    exercise,
    coachPersonality: "supportive", // Default for summaries
    workoutMode: "training",
    onFormFeedback: () => {}, // Not used in post-workout
  });

  // Auto-scroll to results only when workout actually ends
  useEffect(() => {
    if (hasWorkoutEnded && reps > 0 && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 500);
    }
  }, [hasWorkoutEnded, reps]);

  // Handle AI summary generation
  const handleGenerateAISummary = useCallback(async () => {
    if (reps === 0 || selectedCoaches.length === 0) return;

    setIsSummaryLoading(true);
    try {
      const summaries = await getAISessionSummary(
        {
          reps,
          averageFormScore,
          repHistory,
          exercise,
          sessionDuration,
        },
        selectedCoaches
      );
      setSessionSummaries(summaries);
    } catch (error) {
      console.error("Failed to generate AI summaries:", error);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [
    reps,
    selectedCoaches,
    getAISessionSummary,
    averageFormScore,
    repHistory,
    exercise,
    sessionDuration,
  ]);

  // Auto-generate AI summaries when workout ends
  useEffect(() => {
    if (hasWorkoutEnded && reps > 0 && selectedCoaches.length > 0) {
      handleGenerateAISummary();
    }
  }, [hasWorkoutEnded, reps, selectedCoaches, handleGenerateAISummary]);

  // Handle chat messages
  const handleSendMessage = async (message: string, model: CoachModel) => {
    if (!sessionSummaries) return;

    setIsChatLoading(true);
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: message, model },
    ]);

    try {
      const response = await getAIChatResponse(
        chatMessages,
        {
          reps,
          averageFormScore,
          repHistory,
          exercise,
          sessionDuration,
          message,
        },
        model
      );
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: response, model },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that message. Please try again.",
          model,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Calculate rep timings for analytics
  const repTimings = {
    avg:
      repHistory.length > 0
        ? repHistory.reduce((acc, rep, i) => acc + (i > 0 ? 2 : 0), 0) /
          Math.max(repHistory.length - 1, 1)
        : 0,
    stdDev: 0.5, // Simplified for now
  };

  // Convert sessionDuration string to seconds for AWS Lambda
  const convertDurationToSeconds = (durationString: string): number => {
    if (!durationString || durationString === "N/A") return 0;

    // Parse formats like "2m 30s", "45s", "1m", etc.
    const minMatch = durationString.match(/(\d+)m/);
    const secMatch = durationString.match(/(\d+)s/);

    const minutes = minMatch ? parseInt(minMatch[1]) : 0;
    const seconds = secMatch ? parseInt(secMatch[1]) : 0;

    return minutes * 60 + seconds;
  };

  // Determine current flow state
  const getFlowState = (): FlowState => {
    if (reps === 0) return "results";
    if (!isConnected) return "connect";
    if (!isAuthenticated) return "authenticate";
    return "ready";
  };

  const flowState = getFlowState();

  // Get the primary action based on state
  const getPrimaryAction = () => {
    switch (flowState) {
      case "connect":
        return {
          title: "🚀 Unlock Your AI Coach",
          description:
            "Connect your wallet to submit your score and unlock a free, personalized AI-powered performance summary.",
          buttonText: "Connect to Unlock",
          buttonIcon: <Zap className="h-4 w-4" />,
          color: "blue",
        };
      case "authenticate":
        return {
          title: "🛡️ Secure Your Session",
          description:
            "Sign in with Ethereum to unlock blockchain score submission",
          buttonText: "Sign In Securely",
          buttonIcon: <Shield className="h-4 w-4" />,
          color: "blue",
        };
      case "ready":
        return {
          title: "🎉 Submit to Blockchain",
          description:
            "Record your achievement permanently and compete globally",
          buttonText: "Submit Score",
          buttonIcon: <Trophy className="h-4 w-4" />,
          color: "green",
        };
      default:
        return null;
    }
  };

  const primaryAction = getPrimaryAction();

  // Don't show if no workout completed
  if (reps === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Basic AI Analysis - Replaces redundant Workout Complete section */}
      <div ref={resultsRef}>
        <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Brain className="h-5 w-5" />
              Basic AI Analysis
            </CardTitle>
            <CardDescription className="text-blue-700">
              Free insights about your {exercise} performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reps}</div>
                <div className="text-sm text-gray-600">Reps Completed</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(averageFormScore)}%
                </div>
                <div className="text-sm text-gray-600">Avg Form Score</div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-gray-800 mb-2">Quick Tips:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>
                  •{" "}
                  {averageFormScore >= 80
                    ? "Excellent form! Keep it consistent."
                    : "Focus on controlled movements for better form."}
                </li>
                <li>
                  •{" "}
                  {reps >= 5
                    ? "Great endurance! Try increasing intensity."
                    : "Build up reps gradually for strength gains."}
                </li>
                <li>• Remember to maintain steady breathing throughout</li>
              </ul>
            </div>

            {/* AI Coach Selection */}
            <div className="space-y-3">
              <CoachSummarySelector
                selectedCoaches={selectedCoaches}
                onSelectionChange={setSelectedCoaches}
                disabled={isSummaryLoading}
              />

              {selectedCoaches.length > 0 && (
                <Button
                  onClick={handleGenerateAISummary}
                  disabled={isSummaryLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSummaryLoading ? "Analyzing..." : "Get AI Analysis"}
                </Button>
              )}
            </div>

            {/* AI Summaries Display */}
            {(isSummaryLoading || sessionSummaries) && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                {isSummaryLoading && !sessionSummaries && (
                  <p className="text-sm text-gray-600 animate-pulse text-center">
                    🤖 Your AI coaches are analyzing your performance...
                  </p>
                )}

                {sessionSummaries &&
                  Object.keys(sessionSummaries).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">
                        AI Coach Analysis:
                      </h4>
                      {Object.entries(sessionSummaries).map(
                        ([model, summary]) => (
                          <div
                            key={model}
                            className="p-3 bg-white rounded border-l-4 border-green-500"
                          >
                            <p className="font-semibold text-green-700 text-sm mb-1">
                              {model.charAt(0).toUpperCase() + model.slice(1)}'s
                              Analysis:
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {summary}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
              </div>
            )}

            {/* Performance Charts Toggle */}
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="w-full"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showAnalytics ? "Hide" : "Show"} Performance Charts
              </Button>

              {showAnalytics && (
                <div className="mt-4">
                  <PerformanceAnalytics
                    repHistory={repHistory}
                    totalReps={reps}
                    averageFormScore={averageFormScore}
                    exercise={exercise}
                    sessionDuration={sessionDuration}
                    repTimings={repTimings}
                    sessionSummaries={sessionSummaries}
                    isSummaryLoading={isSummaryLoading}
                    onTryAgain={() => window.location.reload()}
                    chatMessages={chatMessages}
                    isChatLoading={isChatLoading}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              )}
            </div>

            <Alert className="border-amber-200 bg-amber-50">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Want detailed analysis?</strong> Get professional AI
                    coaching for just $0.05
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setIsUpsellOpen(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Upgrade
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Primary Action - Context Sensitive */}
      {primaryAction && (
        <Card
          className={cn(
            "border-2 transition-all duration-200",
            primaryAction.color === "blue"
              ? "border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100"
              : "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100"
          )}
        >
          <CardHeader className="pb-3">
            <CardTitle
              className={cn(
                "text-lg",
                primaryAction.color === "blue"
                  ? "text-blue-800"
                  : "text-green-800"
              )}
            >
              {primaryAction.title}
            </CardTitle>
            <CardDescription
              className={cn(
                primaryAction.color === "blue"
                  ? "text-blue-600"
                  : "text-green-600"
              )}
            >
              {primaryAction.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {flowState === "connect" && <InlineWallet showOnboarding={false} />}

            {flowState === "authenticate" && (
              <InlineWallet showOnboarding={false} />
            )}

            {flowState === "ready" && (
              <div className="space-y-3">
                <BlockchainScoreSubmission
                  exercise={exercise}
                  reps={reps}
                  repHistory={repHistory}
                  averageFormScore={averageFormScore}
                  onSubmissionComplete={onSubmissionComplete}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsUpsellOpen(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Premium "Bedrock" Analysis
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Premium Analysis Modal */}
      <PremiumAnalysisUpsell
        isOpen={isUpsellOpen}
        onOpenChange={setIsUpsellOpen}
        workoutData={{
          exercise,
          reps,
          repHistory: repHistory.map((rep) => ({
            score: rep.score,
            details: rep.details as unknown as Record<string, unknown>,
          })),
          averageFormScore,
          duration: convertDurationToSeconds(sessionDuration),
        }}
        onAnalysisComplete={(result) => {
          setAnalysisResult(result);
          // Optionally, display the analysis result in a new component or alert
          console.log("Premium analysis complete:", result);
        }}
      />

      {/* Advanced Features - Simplified */}
      {canShowAchievements && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Trophy className="h-5 w-5" />
              Achievements Unlocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UnlockedAchievements achievements={achievements} />
          </CardContent>
        </Card>
      )}

      {/* Motivational Footer - Only for disconnected users */}
      {!isConnected && (
        <Alert className="border-blue-200 bg-blue-50">
          <Trophy className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <span>
                <strong>Want to compete?</strong> Connect your wallet to join
                the global leaderboard!
              </span>
              <ArrowRight className="h-4 w-4 text-blue-600" />
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
