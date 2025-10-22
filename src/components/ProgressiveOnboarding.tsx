import { useState, useEffect, useContext } from "react";
import { UserContext } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Brain, 
  Zap, 
  Sparkles, 
  ChevronRight, 
  Check, 
  Camera, 
  Target,
  TrendingUp,
  Lightbulb,
  Trophy
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CoachingTierSelector } from "@/components/CoachingTierSelector";

interface ProgressiveOnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  condition: (userStats: any) => boolean;
  priority: "low" | "medium" | "high";
  content: React.ReactNode;
}

interface ProgressiveOnboardingProps {
  onComplete: () => void;
  onTierSelect?: (tier: "free" | "premium" | "agent") => void;
}

export function ProgressiveOnboarding({ onComplete, onTierSelect }: ProgressiveOnboardingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const context = useContext(UserContext);
  const userStats = context?.userStats;
  
  // Define progressive onboarding steps
  const onboardingSteps: ProgressiveOnboardingStep[] = [
    {
      id: "welcome-back",
      title: "Welcome Back!",
      description: "Let's get you back into the groove",
      icon: <Sparkles className="h-5 w-5" />,
      condition: (stats) => stats?.sessions >= 1 && stats?.sessions <= 3,
      priority: "high",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Great to see you again! Based on your previous sessions, we've got some suggestions to help you progress.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Trophy className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-xs font-medium">Keep Going</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <p className="text-xs font-medium">Improve</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                <Target className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-xs font-medium">Excel</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "advanced-features",
      title: "Unlock Advanced Features",
      description: "Take your training to the next level",
      icon: <Lightbulb className="h-5 w-5" />,
      condition: (stats) => stats?.sessions >= 3 && !stats?.hasUsedPremium,
      priority: "high",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You're getting consistent with your workouts! Ready to unlock deeper insights?
          </p>
          <CoachingTierSelector 
            currentTier="free" 
            onTierSelect={(tier) => {
              onTierSelect?.(tier);
              setIsOpen(false);
            }}
            compact={true}
          />
          <div className="text-xs text-muted-foreground">
            <p>💡 Pro tip: The AI Coach Agent can identify subtle form issues that limit your progress</p>
          </div>
        </div>
      )
    },
    {
      id: "performance-insights",
      title: "Performance Insights",
      description: "See how you're really progressing",
      icon: <TrendingUp className="h-5 w-5" />,
      condition: (stats) => stats?.sessions >= 5 && stats?.streak >= 3,
      priority: "medium",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your consistency is paying off! Let's dive deeper into your performance patterns.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-green-500/30">
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-500">
                    {userStats?.improvementRate || "15"}%
                  </div>
                  <div className="text-xs text-muted-foreground">Improvement</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-500/30">
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-500">
                    {userStats?.consistencyScore || "82"}%
                  </div>
                  <div className="text-xs text-muted-foreground">Consistency</div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("showAnalytics"));
              setIsOpen(false);
            }}
          >
            View Full Analytics
          </Button>
        </div>
      )
    },
    {
      id: "training-plans",
      title: "Personalized Training Plans",
      description: "Create adaptive programs for your goals",
      icon: <Target className="h-5 w-5" />,
      condition: (stats) => stats?.sessions >= 10 || stats?.hasUsedPremium,
      priority: "medium",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You're ready for structured training! Create personalized plans that adapt to your progress.
          </p>
          <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <span className="font-medium text-sm">AI Coach Agent</span>
              <Badge variant="secondary" className="text-[10px] ml-auto">Recommended</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              The agent autonomously creates 4-week programs based on your performance patterns
            </p>
          </div>
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
            onClick={() => {
              onTierSelect?.("agent");
              setIsOpen(false);
            }}
          >
            <Brain className="mr-2 h-4 w-4" />
            Unlock Agent Tier
          </Button>
        </div>
      )
    }
  ];

  // Determine which steps to show based on user stats
  const relevantSteps = onboardingSteps.filter(step => 
    userStats && step.condition(userStats)
  );

  // Show onboarding when there are relevant steps and user hasn't dismissed recently
  useEffect(() => {
    if (relevantSteps.length > 0) {
      const lastDismissal = localStorage.getItem("lastProgressiveOnboarding");
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (!lastDismissal || Date.now() - parseInt(lastDismissal) > oneDay) {
        setIsOpen(true);
        setCurrentStep(0);
      }
    }
  }, [relevantSteps.length, userStats]);

  const handleNext = () => {
    if (currentStep < relevantSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem("lastProgressiveOnboarding", Date.now().toString());
    setIsOpen(false);
    onComplete();
  };

  if (relevantSteps.length === 0 || !userStats) {
    return null;
  }

  const currentStepData = relevantSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleComplete()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStepData.icon}
            {currentStepData.title}
          </DialogTitle>
          <DialogDescription>
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {currentStepData.content}
          
          <div className="space-y-4">
            <Progress value={((currentStep + 1) / relevantSteps.length) * 100} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {currentStep + 1} of {relevantSteps.length}
              </span>
              <span>
                {Math.round(((currentStep + 1) / relevantSteps.length) * 100)}% complete
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleComplete}
              className="flex-1"
            >
              Skip
            </Button>
            <Button 
              onClick={handleNext}
              className="flex-1"
            >
              {currentStep === relevantSteps.length - 1 ? "Get Started" : "Next"}
              {currentStep !== relevantSteps.length - 1 && (
                <ChevronRight className="ml-1 h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}