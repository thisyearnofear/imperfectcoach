import React, { useState, useEffect, useRef } from "react";
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
  Star,
} from "lucide-react";
import { BlockchainScoreSubmission } from "./BlockchainScoreSubmission";
import { InlineWallet } from "./UnifiedWallet";
import { Leaderboard } from "./Leaderboard";

import { useUserAuth, useUserDisplay } from "@/hooks/useUserHooks";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { Exercise, RepData } from "@/lib/types";
import PremiumAnalysisUpsell from "./PremiumAnalysisUpsell";
import { cn } from "@/lib/utils";
import { CoachSummarySelector } from "./CoachSummarySelector";
import UnlockedAchievements from "./UnlockedAchievements";
import { useAchievements } from "@/hooks/useAchievements";
import { useAWSAIFeedback } from "@/hooks/useAWSAIFeedback";

interface PostWorkoutFlowProps {
  exercise: Exercise;
  reps: number;
  repHistory: RepData[];
  averageFormScore: number;
  onSubmissionComplete?: () => void;
  isWorkoutActive?: boolean;
  hasWorkoutEnded?: boolean;
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
}: PostWorkoutFlowProps) => {
  const { isConnected, isAuthenticated } = useUserAuth();
  const { basename } = useUserDisplay();
  const { achievements } = useAchievements(reps, repHistory, averageFormScore);

  // AWS AI Coaches for post-workout analysis
  const { getSessionSummary } = useAWSAIFeedback({
    exercise,
    coachPersonality: "supportive",
  });

  const [snelAnalysis, setSnelAnalysis] = useState<string | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: string;
  } | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const canShowSummary = useFeatureGate("AI_SUMMARY");
  const canShowAchievements = useFeatureGate("ACHIEVEMENTS");
  const canShowAnalytics = useFeatureGate("FULL_ANALYTICS");

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

  // Get SNEL basic analysis when workout ends
  useEffect(() => {
    if (hasWorkoutEnded && reps > 0 && !snelAnalysis && !isLoadingAnalysis) {
      setIsLoadingAnalysis(true);
      getSessionSummary({
        exercise,
        reps,
        averageFormScore,
        repHistory,
      })
        .then((result) => {
          setSnelAnalysis(result.snel);
          setIsLoadingAnalysis(false);
        })
        .catch(() => {
          // Fallback analysis
          const fallback =
            averageFormScore >= 80
              ? "Excellent form! Your technique is really coming together. 🐌"
              : "Good effort! Focus on controlled movements for better form. 🐌";
          setSnelAnalysis(fallback);
          setIsLoadingAnalysis(false);
        });
    }
  }, [
    hasWorkoutEnded,
    reps,
    snelAnalysis,
    isLoadingAnalysis,
    getSessionSummary,
    exercise,
    averageFormScore,
    repHistory,
  ]);

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
              <h4 className="font-semibold text-gray-800 mb-2">
                🐌 SNEL Basic Coach:
              </h4>
              {isLoadingAnalysis ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm">SNEL is thinking...</span>
                </div>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {snelAnalysis ||
                    "Great workout! Your consistency is improving. 🐌"}
                </p>
              )}
            </div>

            {/* Achievements inline - only show if any unlocked */}
            {achievements && achievements.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-amber-600" />
                  <h4 className="font-semibold text-amber-800">
                    Achievements Unlocked!
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {achievements.slice(0, 3).map((achievement, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full"
                    >
                      {achievement.name}
                    </span>
                  ))}
                  {achievements.length > 3 && (
                    <span className="text-xs text-amber-700">
                      +{achievements.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <Alert className="border-amber-200 bg-amber-50">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Want detailed analysis?</strong> Get 🐢 STEDDIE
                    Premium coaching for just $0.25
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
        }}
        onAnalysisComplete={(result) => {
          setAnalysisResult(result);
          // Optionally, display the analysis result in a new component or alert
          console.log("Premium analysis complete:", result);
        }}
      />

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
