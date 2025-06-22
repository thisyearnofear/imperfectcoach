import React, { useState } from "react";
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

interface PostWorkoutFlowProps {
  exercise: Exercise;
  reps: number;
  repHistory: RepData[];
  averageFormScore: number;
  onSubmissionComplete?: () => void;
}

type FlowState = "results" | "connect" | "authenticate" | "ready" | "submitted";

export const PostWorkoutFlow = ({
  exercise,
  reps,
  repHistory,
  averageFormScore,
  onSubmissionComplete,
}: PostWorkoutFlowProps) => {
  const { isConnected, isAuthenticated } = useUserAuth();
  const { basename } = useUserDisplay();
  const { achievements } = useAchievements(reps, repHistory, averageFormScore);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const canShowSummary = useFeatureGate("AI_SUMMARY");
  const canShowAchievements = useFeatureGate("ACHIEVEMENTS");
  const canShowAnalytics = useFeatureGate("FULL_ANALYTICS");

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
      {/* Workout Results - Always Visible */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Sparkles className="h-5 w-5" />
            Workout Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-3xl font-bold text-green-700">{reps}</div>
              <div className="text-sm text-green-600 capitalize font-medium">
                {exercise}
              </div>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-3xl font-bold text-green-700">
                {Math.round(averageFormScore)}%
              </div>
              <div className="text-sm text-green-600 font-medium">Avg Form</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
        workoutData={{ exercise, reps, repHistory, averageFormScore }}
        onAnalysisComplete={(result) => {
          setAnalysisResult(result);
          // Optionally, display the analysis result in a new component or alert
          console.log("Premium analysis complete:", result);
        }}
      />

      {/* Quick Leaderboard Preview - Only if connected */}
      {isConnected && (
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Users className="h-5 w-5" />
                Global Leaderboard
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="text-gray-600 hover:text-gray-800"
              >
                {showLeaderboard ? (
                  <>
                    Hide <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Show <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {showLeaderboard && (
            <CardContent>
              <Leaderboard
                exercise={exercise}
                currentUserAddress={undefined}
                refreshTrigger={0}
                compact={true}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Advanced Features - Collapsible */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <TrendingUp className="h-5 w-5" />
              Performance & Analysis
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-gray-600 hover:text-gray-800"
            >
              {showAdvanced ? (
                <>
                  Hide <ChevronUp className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Show <ChevronDown className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
          {!showAdvanced && (
            <CardDescription className="text-gray-600">
              View detailed analytics, AI coach feedback, and performance trends
            </CardDescription>
          )}
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-4">
            {canShowSummary && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">
                  AI Coach Summaries
                </h4>
                <div className="text-sm text-muted-foreground p-4 bg-gray-50 rounded-lg border">
                  <p>
                    <span className="font-semibold text-green-600">
                      Unlocked:
                    </span>{" "}
                    You can now select multiple AI coaches to get diverse
                    feedback on your performance. This feature is available in
                    the main settings.
                  </p>
                </div>
              </div>
            )}

            {canShowAchievements && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">Achievements</h4>
                <UnlockedAchievements achievements={achievements} />
              </div>
            )}

            {!canShowAnalytics && canShowSummary && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Zap className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <div className="flex items-center justify-between">
                    <span>
                      <strong>Want more?</strong> Get a Base Name to unlock
                      detailed analytics and AI chat.
                    </span>
                    <ArrowRight className="h-4 w-4 text-yellow-600" />
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {canShowAnalytics && (
              <div className="text-center text-green-600 py-4">
                <p className="font-semibold">Full Analytics Unlocked!</p>
                <p className="text-sm">
                  You can now access detailed performance charts and AI chat.
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

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
