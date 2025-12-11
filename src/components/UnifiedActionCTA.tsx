import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Trophy,
  Sparkles,
  Brain,
  CheckCircle,
  Wallet,
  Zap,
  BarChart3,
} from "lucide-react";
import { BlockchainScoreSubmission } from "./BlockchainScoreSubmission";
import { InlineWallet } from "./UnifiedWallet";
import { useFeatureAvailability } from "@/hooks/useFeatureGate";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useUser } from "@/hooks/useUserHooks";
import { Exercise, RepData, Achievement } from "@/lib/types";
import { FadeIn } from "./ui/fade-in";
import { useEffect } from "react";

interface UnifiedActionCTAProps {
  exercise: Exercise;
  reps: number;
  repHistory: RepData[];
  averageFormScore: number;
  onSubmissionComplete?: () => void;
  submitPersonalRecord?: () => void;
  onPremiumUpgrade?: () => void;
  achievements?: Achievement[];
  bedrockSectionRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Unified CTA component that handles all call-to-action states:
 * - Free tier: Connection prompt with benefits
 * - Connected tier: Blockchain submission + upgrade prompt
 * - Premium tier: Premium analysis prompt
 * 
 * Consolidates:
 * - SingleActionCTA (3 variants)
 * - CoinbaseConnectionCTA
 */
export const UnifiedActionCTA = ({
  exercise,
  reps,
  repHistory,
  averageFormScore,
  onSubmissionComplete,
  submitPersonalRecord,
  onPremiumUpgrade,
  achievements = [],
  bedrockSectionRef,
}: UnifiedActionCTAProps) => {
  const { tier } = useFeatureAvailability("MULTIPLE_AI_COACHES");
  const { isSolanaConnected, solanaAddress } = useWalletConnection();
  const { isAuthenticated, address } = useUser();

  // Debug logging for tier detection
  useEffect(() => {
    console.log("🔍 UnifiedActionCTA Tier Debug:", {
      tier,
      isSolanaConnected,
      solanaAddress,
      isAuthenticated,
      baseAddress: address,
    });
  }, [tier, isSolanaConnected, solanaAddress, isAuthenticated, address]);

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

  // Achievement badges component with HoverCard details (reused across variants)
  const AchievementBadges = () =>
    achievements.length > 0 ? (
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {achievements.slice(0, 3).map((achievement) => {
          const AchievementIcon = achievement.icon;
          return (
            <HoverCard key={achievement.id}>
              <HoverCardTrigger asChild>
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 text-xs cursor-help hover:bg-yellow-200 transition-colors"
                >
                  <AchievementIcon className="h-3 w-3 mr-1" />
                  {achievement.name}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent className="w-64">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AchievementIcon className="h-4 w-4 text-yellow-700" />
                    </div>
                    <h4 className="font-semibold text-sm">{achievement.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                  </p>
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Unlocked!
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
        {achievements.length > 3 && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Badge variant="outline" className="text-xs cursor-help">
                +{achievements.length - 3} more
              </Badge>
            </HoverCardTrigger>
            <HoverCardContent className="w-64">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Additional Achievements</h4>
                <div className="space-y-1">
                  {achievements.slice(3).map((achievement) => {
                    const AchievementIcon = achievement.icon;
                    return (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <AchievementIcon className="h-3 w-3 text-yellow-600" />
                        <span>{achievement.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
      </div>
    ) : null;

  // Workout summary text (reused across variants)
  const WorkoutSummary = ({ className }: { className?: string }) => (
    <span className={className}>
      <span className="font-semibold">
        {reps} {exercise.replace("-", " ")}
      </span>{" "}
      (<span className="font-semibold">{Math.round(averageFormScore)}%</span>{" "}
      form)
    </span>
  );

  // FREE TIER: Connection CTA with benefits
  if (tier === "free") {
    const benefits = [
      {
        icon: Brain,
        title: "AWS-powered Premium Analysis",
        description: "Bedrock Nova deep dive into your technique",
        highlight: true,
      },
      {
        icon: Trophy,
        title: "On-chain Score Records",
        description: "Permanent achievements on Base Sepolia",
        highlight: false,
      },
      {
        icon: BarChart3,
        title: "Global Leaderboard",
        description: "Compete with athletes worldwide",
        highlight: false,
      },
      {
        icon: Sparkles,
        title: "Multi-AI Coaching",
        description: "Insights from 3 AI coaches + chat",
        highlight: false,
      },
    ];

    return (
      <FadeIn delay={0.1}>
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wallet className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-blue-800">
                🚀 Multi-Chain Coaching Platform
              </CardTitle>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                <Zap className="h-3 w-3 mr-1" />
                Base Sepolia
              </Badge>
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                <Zap className="h-3 w-3 mr-1" />
                Solana Devnet
              </Badge>
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                AWS Powered
              </Badge>
            </div>
            <p className="text-blue-700 text-sm">
              Free Gemini analysis of <WorkoutSummary /> - once connected - is
              just the beginning.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                    benefit.highlight
                      ? "bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200"
                      : "bg-white border border-gray-100"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      benefit.highlight
                        ? "bg-purple-200 text-purple-700"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <benefit.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium text-sm ${
                        benefit.highlight ? "text-purple-800" : "text-gray-800"
                      }`}
                    >
                      {benefit.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {benefit.description}
                    </p>
                  </div>
                  {benefit.highlight && (
                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>

            {/* Connection Section */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <InlineWallet chains="all" showOnboarding={false} />
              </div>

              <Alert className="border-green-200 bg-green-50 justify-center text-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 text-sm">
                  <strong>BASED.</strong> Once connected, submit scores to the
                  global leaderboard + unlock premium AWS analysis for just
                  $0.05.
                </AlertDescription>
              </Alert>

              <div className="text-center pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Powered by Base Sepolia + Solana Devnet</span> •{" "}
                  <span className="font-medium">
                    Professional AI Coaching Platform
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    );
  }

  // CONNECTED TIER: Blockchain submission + upgrade
  if (tier === "connected") {
    return (
      <FadeIn delay={0.2}>
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 text-center">
          <CardHeader>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-6 w-6 text-green-600" />
              <CardTitle className="text-green-800">
                🎉 Ready to Compete?
              </CardTitle>
            </div>
            <p className="text-green-700 text-sm">
              Submit your <WorkoutSummary /> to the global leaderboard
            </p>
            <AchievementBadges />
          </CardHeader>

          <CardContent className="space-y-4">
            <BlockchainScoreSubmission
              exercise={exercise}
              reps={reps}
              repHistory={repHistory}
              averageFormScore={averageFormScore}
              onSubmissionComplete={onSubmissionComplete}
              submitPersonalRecord={submitPersonalRecord}
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
      </FadeIn>
    );
  }

  // PREMIUM TIER: Premium analysis prompt
  if (tier === "premium") {
    return (
      <FadeIn delay={0.2}>
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 text-center">
          <CardHeader>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <CardTitle className="text-purple-800">
                ✨ Premium Analysis Ready
              </CardTitle>
            </div>
            <p className="text-purple-700 text-sm">
              Your <WorkoutSummary /> can now get AWS Bedrock Nova analysis
            </p>
            <AchievementBadges />
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
      </FadeIn>
    );
  }

  return null;
};

export default UnifiedActionCTA;
