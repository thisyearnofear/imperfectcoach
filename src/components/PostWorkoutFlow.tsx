import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/ui/fade-in";
import { toast } from "sonner";

import { Trophy, Brain, Share2 } from "lucide-react";

import { useUserAuth, useUserDisplay } from "@/hooks/useUserHooks";
import { useFeatureGate, useFeatureAvailability } from "@/hooks/useFeatureGate";
import {
  Exercise,
  RepData,
  CoachModel,
  SessionSummaries,
  ChatMessage,
  CoachPersonality,
} from "@/lib/types";
import PremiumAnalysisUpsell from "./PremiumAnalysisUpsell";
import BedrockAnalysisSection from "./BedrockAnalysisSection";
import { UnifiedActionCTA } from "./UnifiedActionCTA";
import { FeatureSpotlight } from "@/components/FeatureSpotlight";
import { AgentCoachUpsell } from "./AgentCoachUpsell";
import { StatusStrip } from "./StatusStrip";
import { KeyboardHint } from "./KeyboardHint";
import { SmartTierRecommendation } from "./SmartTierRecommendation";
import { cn } from "@/lib/utils";
import { CoachSummarySelector } from "./CoachSummarySelector";
import PerformanceAnalytics from "./PerformanceAnalytics";
import { useAchievements } from "@/hooks/useAchievements";
import { useAIFeedback } from "@/hooks/useAIFeedback";
import { useAgentAction } from "@/hooks/useAgentAction";
import { mapPersonalityToLegacy } from "@/lib/coachPersonalities";
import { convertHeight } from "@/lib/heightConversion";
import { JumpRepDetails } from "@/lib/types";
import SocialShareButton from "@/components/SocialShareButton";

interface PostWorkoutFlowProps {
  exercise: Exercise;
  reps: number;
  repHistory: RepData[];
  averageFormScore: number;
  onSubmissionComplete?: () => void;
  submitPersonalRecord?: () => void;
  isWorkoutActive?: boolean;
  hasWorkoutEnded?: boolean;
  sessionDuration?: string;
  coachPersonality: CoachPersonality;
}

export const PostWorkoutFlow = ({
  exercise,
  reps,
  repHistory,
  averageFormScore,
  onSubmissionComplete,
  submitPersonalRecord,
  isWorkoutActive = false,
  hasWorkoutEnded = false,
  sessionDuration = "N/A",
  coachPersonality,
}: PostWorkoutFlowProps) => {
  const { achievements } = useAchievements(reps, repHistory, averageFormScore);

  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: string;
  } | null>(null);
  const [remainingQueries, setRemainingQueries] = useState(3);
  const [showAgentUpsell, setShowAgentUpsell] = useState(false);
  const [agentAchievements, setAgentAchievements] = useState<Set<string>>(new Set());

  // Refs for auto-scroll
  const bedrockSectionRef = useRef<HTMLDivElement>(null);

  // AI Analysis state
  const [selectedCoaches, setSelectedCoaches] = useState<CoachModel[]>([
    "gemini",
  ]);
  const [sessionSummaries, setSessionSummaries] =
    useState<SessionSummaries | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const resultsRef = useRef<HTMLDivElement>(null);

  const canShowSummary = useFeatureGate("AI_SUMMARY");
  const { tier } = useFeatureAvailability("MULTIPLE_AI_COACHES");

  // Initialize AI feedback hook with mapped personality
  const { getAISessionSummary, getAIChatResponse } = useAIFeedback({
    exercise,
    coachPersonality: mapPersonalityToLegacy(coachPersonality),
    workoutMode: "training",
    onFormFeedback: () => {}, // Not used in post-workout
  });

  // Centralized agent action orchestration for session summary
  const summaryAction = useAgentAction({
    personality: coachPersonality,
    onSuccess: (result) => {
      if (result.type === "session-summary") {
        setSessionSummaries(result.data.summaries as SessionSummaries);
        
        // Trigger achievements
        if (!agentAchievements.has("first_ai_analysis")) {
          setAgentAchievements(prev => new Set(prev).add("first_ai_analysis"));
          toast.success("🏆 Achievement Unlocked!", {
            description: "AI Insights - You got your first AI analysis!",
            duration: 5000,
          });
        }
        
        // Check if multiple coaches were used
        const coachCount = Object.keys(result.data.summaries).length;
        if (coachCount > 1 && !agentAchievements.has("agent_explorer")) {
          setAgentAchievements(prev => new Set(prev).add("agent_explorer"));
          toast.success("🏆 Achievement Unlocked!", {
            description: "Agent Explorer - You tried multiple AI coaches!",
            duration: 5000,
          });
        }
      }
    },
  });

  // Centralized agent action orchestration for chat
  const chatAction = useAgentAction({
    personality: coachPersonality,
    onSuccess: (result) => {
      if (result.type === "chat") {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.data.reply, model: result.data.model },
        ]);
        
        // Trigger achievement for first chat
        if (chatMessages.length === 0 && !agentAchievements.has("ai_conversation")) {
          setAgentAchievements(prev => new Set(prev).add("ai_conversation"));
          toast.success("🏆 Achievement Unlocked!", {
            description: "Coach Chat - You had a conversation with an AI coach!",
            duration: 5000,
          });
        }
      }
    },
    onError: () => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that message. Please try again.",
          model: "gemini",
        },
      ]);
    },
  });

  // Handle follow-up queries for Bedrock analysis
  // Helper function to convert jump heights to cm for AI analysis
  const processRepHistoryForAI = useCallback(
    (repHistory: RepData[]) => {
      if (exercise !== "jumps") return repHistory;

      const processed = repHistory.map((rep, index) => {
        const original = rep.details as JumpRepDetails;
        const processed = rep.details
          ? {
              ...rep.details,
              jumpHeight: Math.round(
                convertHeight((rep.details as JumpRepDetails).jumpHeight, "cm")
              ),
              jumpHeightCm: Math.round(
                convertHeight((rep.details as JumpRepDetails).jumpHeight, "cm")
              ),
            }
          : rep.details;

        // Debug logging for AI data transformation
        if (
          process.env.NODE_ENV === "development" &&
          original &&
          "jumpHeight" in original
        ) {
          const jumpOriginal = original as JumpRepDetails;
          console.log(`🤖 AI Data Transform Rep ${index + 1}:`, {
            originalJumpHeight: jumpOriginal.jumpHeight?.toFixed(1) ?? "null",
            originalLandingKnee:
              jumpOriginal.landingKneeFlexion?.toFixed(1) ?? "null",
            originalLandingScore: jumpOriginal.landingScore ?? "null",
            convertedJumpHeight:
              processed && "jumpHeight" in processed
                ? processed.jumpHeight
                : "null",
            landingKneeToAI:
              processed && "landingKneeFlexion" in processed
                ? processed.landingKneeFlexion
                : "null",
            landingScoreToAI:
              processed && "landingScore" in processed
                ? processed.landingScore
                : "null",
          });
        }

        return {
          ...rep,
          details: processed,
        };
      });

      return processed;
    },
    [exercise]
  );

  const handleFollowUpQuery = async (query: string, model: CoachModel) => {
    if (remainingQueries <= 0) return "";

    try {
      const processedRepHistory = processRepHistoryForAI(repHistory);

      // Calculate jump analytics for follow-up queries
      let jumpAnalytics = {};
      if (exercise === "jumps" && processedRepHistory.length > 0) {
        const jumpDetails = processedRepHistory
          .map((rep) => rep.details)
          .filter(
            (details): details is JumpRepDetails =>
              details !== undefined && "jumpHeight" in details
          );

        if (jumpDetails.length > 0) {
          const landingAngles = jumpDetails.map((d) => d.landingKneeFlexion);
          const jumpHeights = jumpDetails.map((d) => d.jumpHeight);
          const landingScores = jumpDetails
            .map((d) => d.landingScore)
            .filter((s) => s !== undefined);

          jumpAnalytics = {
            avgLandingAngle:
              landingAngles.reduce((a, b) => a + b, 0) / landingAngles.length,
            landingSuccessRate:
              (landingAngles.filter((angle) => angle < 140).length /
                landingAngles.length) *
              100,
            avgJumpHeight:
              jumpHeights.reduce((a, b) => a + b, 0) / jumpHeights.length,
            avgLandingScore:
              landingScores.length > 0
                ? landingScores.reduce((a, b) => a + b, 0) /
                  landingScores.length
                : 0,
          };
        }
      }

      const response = await getAIChatResponse(
        chatMessages,
        {
          reps,
          averageFormScore,
          repHistory: processedRepHistory,
          exercise,
          sessionDuration,
          message: query,
          ...(exercise === "jumps" && { jumpAnalytics }),
        },
        model
      );
      setRemainingQueries((prev) => prev - 1);
      return response;
    } catch (error) {
      console.error("Follow-up query error:", error);
      return "Sorry, I couldn't process that query. Please try again.";
    }
  };

  const handleUpgrade = () => {
    setIsUpsellOpen(true);
    // Auto-scroll to Bedrock section
    setTimeout(() => {
      bedrockSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

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

  // Handle AI summary generation using centralized agent action
  const handleGenerateAISummary = useCallback(async () => {
    if (reps === 0 || selectedCoaches.length === 0) return;

    const processedRepHistory = processRepHistoryForAI(repHistory);

    // Calculate jump-specific analytics for AI
    let jumpAnalytics = {};
    if (exercise === "jumps" && processedRepHistory.length > 0) {
      const jumpDetails = processedRepHistory
        .map((rep) => rep.details)
        .filter(
          (details): details is JumpRepDetails =>
            details !== undefined && "jumpHeight" in details
        );

      if (jumpDetails.length > 0) {
        const landingAngles = jumpDetails.map((d) => d.landingKneeFlexion);
        const jumpHeights = jumpDetails.map((d) => d.jumpHeight);
        const landingScores = jumpDetails
          .map((d) => d.landingScore)
          .filter((s) => s !== undefined);

        jumpAnalytics = {
          totalJumps: jumpDetails.length,
          avgLandingAngle:
            landingAngles.reduce((a, b) => a + b, 0) / landingAngles.length,
          bestLandingAngle: Math.min(...landingAngles),
          worstLandingAngle: Math.max(...landingAngles),
          avgJumpHeight:
            jumpHeights.reduce((a, b) => a + b, 0) / jumpHeights.length,
          maxJumpHeight: Math.max(...jumpHeights),
          avgLandingScore:
            landingScores.length > 0
              ? landingScores.reduce((a, b) => a + b, 0) /
                landingScores.length
              : 0,
          goodLandings: landingAngles.filter((angle) => angle < 140).length,
          landingSuccessRate:
            (landingAngles.filter((angle) => angle < 140).length /
              landingAngles.length) *
            100,
          landingProgression: landingAngles,
          heightProgression: jumpHeights,
        };
      }
    }

    // Debug logging for final AI data
    if (process.env.NODE_ENV === "development" && exercise === "jumps") {
      console.log("📤 Final Data Sent to Gemini:", {
        reps,
        averageFormScore,
        totalReps: processedRepHistory.length,
        jumpAnalytics,
        jumpData: processedRepHistory.map((rep, i) => {
          const details = rep.details;
          const jumpDetails =
            details && "jumpHeight" in details
              ? (details as JumpRepDetails)
              : null;
          return {
            rep: i + 1,
            score: rep.score,
            jumpHeight: jumpDetails?.jumpHeight ?? "null",
            landingKnee: jumpDetails?.landingKneeFlexion ?? "null",
            landingScore: jumpDetails?.landingScore ?? "null",
          };
        }),
        exercise,
        sessionDuration,
      });
    }

    await summaryAction.execute({
      type: "session-summary",
      params: {
        reps,
        workoutMode: "training",
        exercise,
        stats: {
          averageFormScore,
          repHistory: processedRepHistory,
          sessionDuration,
          ...(exercise === "jumps" && { jumpAnalytics }),
        },
        selectedCoaches,
      },
    });
  }, [
    reps,
    selectedCoaches,
    summaryAction,
    averageFormScore,
    repHistory,
    exercise,
    sessionDuration,
    processRepHistoryForAI,
  ]);

  // Auto-generate AI summaries when workout ends
  useEffect(() => {
    if (hasWorkoutEnded && reps > 0 && selectedCoaches.length > 0) {
      handleGenerateAISummary();
    }
  }, [hasWorkoutEnded, reps, selectedCoaches, handleGenerateAISummary]);

  // Handle chat messages using centralized agent action
  const handleSendMessage = useCallback(async (message: string, model: CoachModel) => {
    if (!sessionSummaries) return;

    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: message, model },
    ]);

    const processedRepHistory = processRepHistoryForAI(repHistory);

    // Calculate jump analytics for chat
    let jumpAnalytics = {};
    if (exercise === "jumps" && processedRepHistory.length > 0) {
      const jumpDetails = processedRepHistory
        .map((rep) => rep.details)
        .filter(
          (details): details is JumpRepDetails =>
            details !== undefined && "jumpHeight" in details
        );

      if (jumpDetails.length > 0) {
        const landingAngles = jumpDetails.map((d) => d.landingKneeFlexion);
        const jumpHeights = jumpDetails.map((d) => d.jumpHeight);
        const landingScores = jumpDetails
          .map((d) => d.landingScore)
          .filter((s) => s !== undefined);

        jumpAnalytics = {
          avgLandingAngle:
            landingAngles.reduce((a, b) => a + b, 0) / landingAngles.length,
          landingSuccessRate:
            (landingAngles.filter((angle) => angle < 140).length /
              landingAngles.length) *
            100,
          avgJumpHeight:
            jumpHeights.reduce((a, b) => a + b, 0) / jumpHeights.length,
          avgLandingScore:
            landingScores.length > 0
              ? landingScores.reduce((a, b) => a + b, 0) /
                landingScores.length
              : 0,
        };
      }
    }

    await chatAction.execute({
      type: "chat",
      params: {
        messages: [
          ...chatMessages,
          { role: "user", content: message, model },
        ],
        model,
      },
    });
  }, [sessionSummaries, chatMessages, chatAction, processRepHistoryForAI, repHistory, exercise, reps, averageFormScore, sessionDuration]);

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

  // Don't show if no workout completed
  if (reps === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Free Tier: Basic Analysis + Connection CTA */}
      {tier === "free" && (
        <div ref={resultsRef} className="space-y-4">
          {/* Basic Free Analysis */}
          <FadeIn>
          <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800 justify-center">
                <Brain className="h-5 w-5" />
                Analysis [basic]
              </CardTitle>
              <CardDescription className="text-blue-700 text-center">
                About your {exercise} performance
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
                  Quick Tips:
                </h4>
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
                      ? "Build endurance! Try increasing intensity."
                      : "Build up reps gradually for strength gains."}
                  </li>
                  <li>• Remember to maintain steady breathing throughout</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          </FadeIn>

          {/* Social Sharing */}
          <FadeIn delay={0.1}>
            <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 justify-center">
                  <Share2 className="h-5 w-5" />
                  Share Your Workout
                </CardTitle>
                <CardDescription className="text-green-700 text-center">
                  Celebrate your achievement with friends
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <SocialShareButton 
                  exercise={exercise}
                  totalReps={reps}
                  averageFormScore={Math.round(averageFormScore)}
                />
              </CardContent>
            </Card>
          </FadeIn>

          {/* Unified CTA - handles connection flow */}
          <UnifiedActionCTA
            exercise={exercise}
            reps={reps}
            repHistory={repHistory}
            averageFormScore={averageFormScore}
            onSubmissionComplete={onSubmissionComplete}
            achievements={achievements}
          />
        </div>
      )}

      {/* Connected/Premium Tier: Simplified Analysis */}
      {tier !== "free" && (
        <div ref={resultsRef} className="space-y-4">
          {/* Status Strip - Network and CDP status */}
          <StatusStrip variant="full" showCDP={true} showNetwork={true} />
          
          <FadeIn>
          <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-blue-800">
                <Brain className="h-5 w-5" />
                Analysis - {reps} {exercise.replace("-", " ")} (
                {Math.round(averageFormScore)}% form)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              {/* AI Coach Selection */}
              {canShowSummary && (
                <div className="space-y-3">
                  <CoachSummarySelector
                    selectedCoaches={selectedCoaches}
                    onSelectionChange={setSelectedCoaches}
                    disabled={summaryAction.status === "loading"}
                    onUpgrade={handleUpgrade}
                    bedrockSectionRef={bedrockSectionRef}
                  />

                  {selectedCoaches.length > 0 && (
                    <AnimatedButton
                      onClick={handleGenerateAISummary}
                      disabled={summaryAction.status === "loading"}
                      disableAnimation={summaryAction.status === "loading"}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                      animationPreset="scale"
                    >
                      {summaryAction.status === "loading" ? "Analyzing..." : "Get AI Analysis"}
                    </AnimatedButton>
                  )}
                </div>
              )}

              {/* AI Summaries Display */}
              {(summaryAction.status === "loading" || sessionSummaries) && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  {summaryAction.status === "loading" && !sessionSummaries && (
                    <p className="text-sm text-gray-600 animate-pulse text-center">
                      🤖 Analyzing your performance...
                    </p>
                  )}

                  {sessionSummaries &&
                    Object.keys(sessionSummaries).length > 0 && (
                      <div className="space-y-3 text-left">
                        {Object.entries(sessionSummaries).map(
                          ([model, summary]) => (
                            <div
                              key={model}
                              className="p-3 bg-white rounded border-l-4 border-green-500"
                            >
                              <p className="font-semibold text-green-700 text-sm mb-1">
                                {model.charAt(0).toUpperCase() + model.slice(1)}
                                :
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
            </CardContent>
          </Card>
          </FadeIn>

      {/* Feature Spotlight - Contextual feature discovery */}
          <FadeIn delay={0.05}>
            <FeatureSpotlight variant="card" />
          </FadeIn>
          
          {/* Social Sharing */}
          <FadeIn delay={0.1}>
            <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 justify-center">
                  <Share2 className="h-5 w-5" />
                  Share Your Workout
                </CardTitle>
                <CardDescription className="text-green-700 text-center">
                  Celebrate your achievement with friends
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <SocialShareButton 
                  exercise={exercise}
                  totalReps={reps}
                  averageFormScore={Math.round(averageFormScore)}
                />
              </CardContent>
            </Card>
          </FadeIn>
          
      {/* Smart Tier Recommendation - Personalized suggestion */}
          <FadeIn delay={0.1}>
          <SmartTierRecommendation
            workoutData={{
              exercise,
              reps,
              averageFormScore,
              repHistory: repHistory.map(r => ({ score: r.score })),
              hasFormIssues: averageFormScore < 70,
              hasAsymmetry: false, // Can be enhanced with pose data analysis
              isPersonalBest: reps >= 10, // Simplified, can track actual PBs
            }}
            onSelectTier={(tier) => {
              if (tier === "premium") {
                handleUpgrade();
              } else if (tier === "agent") {
                setShowAgentUpsell(true);
                setTimeout(() => {
                  bedrockSectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }, 100);
              }
            }}
          />
          </FadeIn>

          {/* Agent Coach Upsell */}
          {showAgentUpsell && (
            <FadeIn delay={0.2}>
            <AgentCoachUpsell
              workoutData={{
                exercise,
                reps,
                formScore: averageFormScore,
                poseData: {}, // Can be enhanced with actual pose data
                userId: undefined,
              }}
              onSuccess={(analysis) => {
                console.log("Agent analysis complete:", analysis);
              }}
            />
            </FadeIn>
          )}

          {/* Unified CTA - handles connected/premium flows */}
          <UnifiedActionCTA
            exercise={exercise}
            reps={reps}
            repHistory={repHistory}
            averageFormScore={averageFormScore}
            onSubmissionComplete={onSubmissionComplete}
            submitPersonalRecord={submitPersonalRecord}
            onPremiumUpgrade={handleUpgrade}
            achievements={achievements}
            bedrockSectionRef={bedrockSectionRef}
          />

          {/* Keyboard Hint */}
          <KeyboardHint
            keys={["⌘", "K"]}
            description="Quick actions"
            className="mt-4"
          />
        </div>
      )}

      {/* Bedrock Analysis Section - Visible for connected and premium users */}
      {(tier === "connected" || tier === "premium") && (
        <div ref={bedrockSectionRef}>
          <FadeIn delay={0.2}>
          <BedrockAnalysisSection
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
              setRemainingQueries(3); // Reset queries after purchase
              setIsUpsellOpen(false); // Close any open modals
            }}
            onFollowUpQuery={handleFollowUpQuery}
            remainingQueries={remainingQueries}
            repHistory={repHistory}
            exercise={exercise}
            sessionDuration={sessionDuration}
            repTimings={repTimings}
            sessionSummaries={sessionSummaries}
            isSummaryLoading={summaryAction.status === "loading"}
            chatMessages={chatMessages}
            isChatLoading={chatAction.status === "loading"}
            onSendMessage={handleSendMessage}
            onUpgrade={handleUpgrade}
            onTryAgain={() => window.location.reload()}
          />
          </FadeIn>
        </div>
      )}

      {/* Legacy Premium Analysis Modal - Only show for non-connected users */}
      {tier === "free" && (
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
            setRemainingQueries(3);
            setIsUpsellOpen(false);
          }}
        />
      )}
    </div>
  );
};
