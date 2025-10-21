import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sparkles, Shield, Brain, CheckCircle } from "lucide-react";
import { BlockchainScoreSubmission } from "./BlockchainScoreSubmission";
import { InlineWallet } from "./UnifiedWallet";
import { useFeatureAvailability } from "@/hooks/useFeatureGate";
import { Exercise, RepData, Achievement } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SingleActionCTAProps {
  exercise: Exercise;
  reps: number;
  repHistory: RepData[];
  averageFormScore: number;
  onSubmissionComplete?: () => void;
  onPremiumUpgrade?: () => void;
  achievements?: Achievement[];
  bedrockSectionRef?: React.RefObject<HTMLDivElement>;
}

const SingleActionCTA = ({
  exercise,
  reps,
  repHistory,
  averageFormScore,
  onSubmissionComplete,
  onPremiumUpgrade,
  achievements = [],
  bedrockSectionRef,
}: SingleActionCTAProps) => {
  const { tier } = useFeatureAvailability("MULTIPLE_AI_COACHES");

  const handleUpgradeClick = () => {
    if (onPremiumUpgrade) {
      onPremiumUpgrade();
    }
    // Auto-scroll to Bedrock section
    setTimeout(() => {
      bedrockSectionRef?.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  // Don't show if no workout completed
  if (reps === 0) return null;

  // Free tier users see connection CTA (handled elsewhere)
  if (tier === "free") return null;

  // Connected users: Focus on blockchain submission
  if (tier === "connected") {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 text-center">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-800">
              🎉 Ready to Compete?
            </CardTitle>
          </div>
          <p className="text-green-700 text-sm">
            Submit your{" "}
            <span className="font-semibold">
              {reps} {exercise.replace("-", " ")}
            </span>{" "}
            (
            <span className="font-semibold">
              {Math.round(averageFormScore)}%
            </span>{" "}
            form) to the global leaderboard
          </p>

          {/* Achievement Badges */}
          {achievements.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {achievements.slice(0, 3).map((achievement) => (
                <Badge
                  key={achievement.id}
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 text-xs"
                >
                  <Trophy className="h-3 w-3 mr-1" />
                  {achievement.name}
                </Badge>
              ))}
              {achievements.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{achievements.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <BlockchainScoreSubmission
            exercise={exercise}
            reps={reps}
            repHistory={repHistory}
            averageFormScore={averageFormScore}
            onSubmissionComplete={onSubmissionComplete}
          />

          <div className="pt-2 border-t border-green-200">
            <AnimatedButton
              onClick={handleUpgradeClick}
              variant="outline"
              size="sm"
              className="text-xs"
              animationPreset="lift"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Get Premium Analysis - $0.05
            </AnimatedButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Premium users: Focus on premium analysis
  if (tier === "premium") {
    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 text-center">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <CardTitle className="text-purple-800">
              ✨ Premium Analysis Ready
            </CardTitle>
          </div>
          <p className="text-purple-700 text-sm">
            Your{" "}
            <span className="font-semibold">
              {reps} {exercise.replace("-", " ")}
            </span>{" "}
            (
            <span className="font-semibold">
              {Math.round(averageFormScore)}%
            </span>{" "}
            form) can now get AWS Bedrock Nova analysis
          </p>

          {/* Achievement Badges */}
          {achievements.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {achievements.slice(0, 3).map((achievement) => (
                <Badge
                  key={achievement.id}
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {achievement.name}
                </Badge>
              ))}
              {achievements.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{achievements.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <AnimatedButton
            onClick={handleUpgradeClick}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            animationPreset="glow"
          >
            <Brain className="h-4 w-4 mr-2" />
            Get Bedrock Deep Dive - $0.05
          </AnimatedButton>

          <div className="text-xs text-purple-600">
            Advanced biomechanical analysis + 3 AI coach queries
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default SingleActionCTA;
