import { useState, useEffect } from "react";
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
import { Brain, Zap, Sparkles, ChevronRight, Check, Camera, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const steps = [
    {
      title: "Welcome to Imperfect Coach! 🏋️",
      description: "Your AI-powered fitness companion",
      content: (
        <div className="space-y-4">
          <p className="text-center text-muted-foreground">
            We use cutting-edge AI to analyze your form, count your reps, and provide
            personalized coaching. Let's get you started!
          </p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Camera className="h-6 w-6 text-blue-400" />
              </div>
              <p className="text-xs font-medium">Real-time</p>
              <p className="text-xs text-muted-foreground">Live feedback</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                <Brain className="h-6 w-6 text-purple-400" />
              </div>
              <p className="text-xs font-medium">AI-Powered</p>
              <p className="text-xs text-muted-foreground">Smart analysis</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                <Target className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-xs font-medium">Personalized</p>
              <p className="text-xs text-muted-foreground">Just for you</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Three Tiers of Coaching",
      description: "Choose what works for you",
      content: (
        <div className="space-y-3">
          {/* Free Tier */}
          <div className="border-2 border-green-500/50 rounded-lg p-4 bg-green-500/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-4 w-4 text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Free Tier</h4>
                <Badge variant="outline" className="text-xs">Always Available</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground ml-10">
              Real-time coaching, rep counting, form scoring
            </p>
          </div>

          {/* Premium Tier */}
          <div className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Premium Tier</h4>
                <Badge variant="outline" className="text-xs">$0.05 USDC</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground ml-10">
              Deep-dive analysis, detailed breakdown, recommendations
            </p>
          </div>

          {/* Agent Tier */}
          <div className="border-2 border-purple-500/50 rounded-lg p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Brain className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm flex items-center gap-1">
                  AI Agent Tier
                  <Sparkles className="h-3 w-3 text-purple-400" />
                </h4>
                <Badge variant="outline" className="text-xs">$0.10 USDC</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground ml-10">
              Autonomous coaching, training plans, benchmarking
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            💡 Start free, upgrade anytime!
          </p>
        </div>
      ),
    },
    {
      title: "How It Works",
      description: "Simple 3-step process",
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-400">1</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Set Up Your Camera</h4>
              <p className="text-xs text-muted-foreground">
                Position your device so we can see your full body. Good lighting helps!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-400">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Choose Your Exercise & Coach</h4>
              <p className="text-xs text-muted-foreground">
                Pick pull-ups or jumps, select a coach personality, and start your workout!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-400">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Get Real-Time Feedback</h4>
              <p className="text-xs text-muted-foreground">
                Watch your form score, hear coaching tips, and track your progress!
              </p>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mt-4">
            <p className="text-xs text-center font-medium">
              🎯 After your workout, choose your analysis level
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "You're Ready! 🚀",
      description: "Let's start your fitness journey",
      content: (
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-green-400" />
          </div>
          <p className="text-muted-foreground">
            You now know everything to get started with Imperfect Coach!
          </p>
          <div className="space-y-2 text-left bg-card border rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">Quick Tips:</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-400" />
                Start with free tier to get comfortable
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-400" />
                Use good lighting for best results
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-400" />
                Stay in frame during your workout
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-400" />
                Upgrade for deeper insights anytime
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
    onComplete();
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {steps[currentStep].title}
            <Badge variant="outline" className="text-xs">
              {currentStep + 1} / {steps.length}
            </Badge>
          </DialogTitle>
          <DialogDescription>{steps[currentStep].description}</DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <Progress value={progressPercentage} className="h-1" />

        {/* Content */}
        <div className="py-4">{steps[currentStep].content}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleSkip} size="sm">
            Skip
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                size="sm"
              >
                Back
              </Button>
            )}
            <Button onClick={handleNext} size="sm">
              {currentStep < steps.length - 1 ? (
                <>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </>
              ) : (
                "Get Started!"
              )}
            </Button>
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-1 pb-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? "bg-primary w-6"
                  : index < currentStep
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
