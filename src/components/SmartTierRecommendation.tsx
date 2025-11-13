import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, AlertTriangle, TrendingUp, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkoutData {
  exercise: string;
  reps: number;
  averageFormScore: number;
  repHistory: Array<{ score: number }>;
  hasFormIssues?: boolean;
  hasAsymmetry?: boolean;
  isPersonalBest?: boolean;
}

interface SmartTierRecommendationProps {
  workoutData: WorkoutData;
  onSelectTier: (tier: "free" | "premium" | "agent") => void;
}

export function SmartTierRecommendation({
  workoutData,
  onSelectTier,
}: SmartTierRecommendationProps) {
  // Analyze workout to determine best recommendation
  const getRecommendation = () => {
    const { averageFormScore, reps, hasFormIssues, hasAsymmetry, isPersonalBest } = workoutData;

    // Detect form variability
    const formVariability = workoutData.repHistory.reduce((acc, rep, idx) => {
      if (idx === 0) return 0;
      return acc + Math.abs(rep.score - workoutData.repHistory[idx - 1].score);
    }, 0) / (workoutData.repHistory.length - 1);

    // Agent tier recommendation (serious issues or high performance)
    if (hasFormIssues || hasAsymmetry || formVariability > 15) {
      return {
        tier: "agent" as const,
        reason: "serious_issues",
        title: "Consider the AI Coach Agent",
        description: "Detected form issues that need personalized attention",
        urgency: "high" as const,
        insights: [
          hasFormIssues && "Form inconsistencies detected",
          hasAsymmetry && "Asymmetry in movement pattern",
          formVariability > 15 && "High form variability between reps",
        ].filter(Boolean) as string[],
      };
    }

    // Premium recommendation (good workout, wants insights)
    if (averageFormScore >= 75 || isPersonalBest) {
      return {
        tier: "premium" as const,
        reason: "good_performance",
        title: "Great Workout! Go Deeper?",
        description: "Get detailed analysis of what you did well",
        urgency: "medium" as const,
        insights: [
          averageFormScore >= 85 && "Excellent form quality",
          isPersonalBest && "Personal best performance!",
          reps >= 10 && `Strong ${reps} reps completed`,
        ].filter(Boolean) as string[],
      };
    }

    // Free tier sufficient (casual workout)
    return {
      tier: "free" as const,
      reason: "casual_workout",
      title: "Solid Workout!",
      description: "Your free analysis covers the basics",
      urgency: "low" as const,
      insights: ["Keep up the consistency", "Form is developing well"],
    };
  };

  const recommendation = getRecommendation();

  // Render appropriate card based on recommendation
  if (recommendation.tier === "free") {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            {recommendation.title}
          </CardTitle>
          <CardDescription className="text-xs">{recommendation.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendation.insights.map((insight, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 rounded-full bg-green-400" />
              {insight}
            </div>
          ))}
          <div className="pt-3 border-t text-xs text-center text-muted-foreground">
            Want more insights? Try Premium or Agent tiers below
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendation.tier === "premium") {
    return (
      <Card className="border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-blue-500/5 relative overflow-hidden">
        {/* Subtle animated shine */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />

        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-400" />
              {recommendation.title}
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-blue-500/20 border-blue-400">
              Recommended
            </Badge>
          </div>
          <CardDescription className="text-xs">{recommendation.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 relative">
          <div className="space-y-2">
            <p className="text-xs font-semibold">Why Premium makes sense for you:</p>
            {recommendation.insights.map((insight, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-muted-foreground">{insight}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-950/30 border border-blue-500/20 rounded-lg p-4">
            <p className="text-xs font-medium mb-2">You'll get:</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Detailed form breakdown per rep</li>
              <li>• Specific technique recommendations</li>
              <li>• Consistency scoring</li>
              <li>• Performance trends</li>
            </ul>
          </div>

          <AnimatedButton
            onClick={() => onSelectTier("premium")}
            className="w-full"
            size="sm"
            animationPreset="glow"
          >
            <Zap className="mr-2 h-4 w-4" />
            Unlock Premium Analysis - $0.05
          </AnimatedButton>

          <p className="text-center text-xs text-muted-foreground">
            Or skip to <button
              onClick={() => onSelectTier("agent")}
              className="text-purple-400 hover:text-purple-300 underline"
            >
              AI Agent tier
            </button> for complete coaching
          </p>
        </CardContent>
      </Card>
    );
  }

  // Agent tier recommendation
  return (
    <Card className="border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-blue-500/10 relative overflow-hidden">
      {/* Pulsing glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-purple-500/5 animate-pulse pointer-events-none" />

      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            {recommendation.title}
            <Sparkles className="h-3 w-3 text-purple-400" />
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-red-500/20 border-red-400 animate-pulse">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Attention Needed
          </Badge>
        </div>
        <CardDescription className="text-xs">{recommendation.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {/* What we detected */}
        <div className="bg-red-950/30 border-2 border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-xs font-semibold text-red-300">Issues Detected:</p>
          </div>
          {recommendation.insights.map((insight, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-red-200 ml-6">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {insight}
            </div>
          ))}
        </div>

        {/* Why agent is best */}
        <div className="space-y-2">
          <p className="text-xs font-semibold">Why the AI Coach Agent?</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-purple-950/30 border border-purple-500/20 rounded p-2">
              <Target className="h-4 w-4 text-purple-400 mb-1" />
              <p className="text-xs font-medium">Root Cause</p>
              <p className="text-xs text-muted-foreground">Find underlying issues</p>
            </div>
            <div className="bg-blue-950/30 border border-blue-500/20 rounded p-2">
              <TrendingUp className="h-4 w-4 text-blue-400 mb-1" />
              <p className="text-xs font-medium">Custom Plan</p>
              <p className="text-xs text-muted-foreground">4-week corrective program</p>
            </div>
          </div>
        </div>

        {/* What agent will do */}
        <div className="bg-purple-950/30 border border-purple-500/20 rounded-lg p-4">
          <p className="text-xs font-medium mb-2 flex items-center gap-2">
            <Brain className="h-3 w-3 text-purple-400" />
            The agent will autonomously:
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground ml-5">
            <li>• Analyze your pose data for patterns</li>
            <li>• Query your workout history</li>
            <li>• Benchmark vs similar athletes</li>
            <li>• Generate personalized training plan</li>
          </ul>
        </div>

        <AnimatedButton
          onClick={() => onSelectTier("agent")}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          size="sm"
          animationPreset="glow"
        >
          <Brain className="mr-2 h-4 w-4" />
          Get AI Coach Agent - $0.10
        </AnimatedButton>

        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            Not ready? Try{" "}
            <button
              onClick={() => onSelectTier("premium")}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Premium ($0.05)
            </button>
          </p>
          <p className="text-xs text-muted-foreground/70">
            These issues may limit your progress
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Add shimmer animation to global CSS or tailwind config
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer {
//   animation: shimmer 3s ease-in-out infinite;
// }
