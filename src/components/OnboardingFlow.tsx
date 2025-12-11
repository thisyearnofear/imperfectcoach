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
import { Brain, Sparkles, ChevronRight, Check, Camera, Target, Users, Network, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AgentValueProposition } from "@/components/agent-economy/AgentValueProposition";
import { CoachingTierCard } from "@/components/CoachingTierCard";

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
          {/* Coaching Tiers - Using shared component */}
          <CoachingTierCard tier="free" className="mb-3" />
          <CoachingTierCard tier="premium" className="mb-3" />
          <CoachingTierCard tier="agent" showAgentEconomyInfo={true} />

          <p className="text-center text-xs text-muted-foreground mt-4">
            💡 Start free, upgrade to agent coordination anytime!
          </p>
        </div>
      ),
    },
    {
      title: "Agent Economy Explained",
      description: "How 5 specialists work together for you",
      content: (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <Badge variant="secondary" className="mb-2">
              <Network className="h-3 w-3 mr-1" />
              x402 Multi-Agent Coordination
            </Badge>
            <p className="text-sm text-muted-foreground">
              Instead of hiring 5 separate experts, our AI agents coordinate to give you comprehensive coaching at a fraction of the cost.
            </p>
          </div>

          {/* Agent Value Proposition - Compact version */}
          <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-lg p-3">
            <AgentValueProposition variant="compact" showNetwork={false} />
          </div>

          {/* How it works steps */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-400">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">You Request Analysis</h4>
                <p className="text-xs text-muted-foreground">
                  After your workout, choose the Agent Tier for comprehensive insights.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-400">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Agents Coordinate</h4>
                <p className="text-xs text-muted-foreground">
                  5 AI specialists (Fitness, Nutrition, Biomechanics, Recovery, Scheduling) work together via x402 protocol.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-400">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Receive Personalized Plan</h4>
                <p className="text-xs text-muted-foreground">
                  Get a comprehensive training program with insights from all specialists.
                </p>
              </div>
            </div>
          </div>

          {/* Cost Comparison */}
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium">Your Cost</span>
              <span className="text-lg font-bold text-green-400">$0.10</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Traditional cost</span>
              <span className="line-through">$350+</span>
            </div>
            <div className="text-center mt-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                Save 99.97%
              </Badge>
            </div>
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
            You're ready to experience AI-powered coaching with multi-agent coordination!
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
                Try Agent Tier for 5x the insights at 1/1000th the cost
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-400" />
                Agents coordinate via x402 for comprehensive analysis
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
