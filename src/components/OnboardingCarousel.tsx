import React, { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Trophy,
  Dumbbell,
  TrendingUp,
  Wallet,
  Zap,
  CheckCircle,
  X,
  ChevronRight,
} from "lucide-react";
import { InlineWallet } from "./UnifiedWallet";
import { cn } from "@/lib/utils";

interface OnboardingCarouselProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingCarousel = ({
  onComplete,
  onSkip,
}: OnboardingCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Track carousel changes
  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const isLastSlide = current === count - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl relative">
        {/* Skip button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-12 right-0 text-muted-foreground hover:text-foreground"
          onClick={onSkip}
        >
          <X className="h-4 w-4 mr-2" />
          Skip
        </Button>

        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {/* Slide 1: Welcome */}
            <CarouselItem>
              <Card className="border-2">
                <CardContent className="flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20" />
                    <Dumbbell className="h-20 w-20 text-primary relative z-10" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Welcome to ImperfectCoach
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      Your AI-powered fitness companion
                    </p>
                  </div>
                  <p className="text-sm max-w-md text-muted-foreground">
                    Get real-time form analysis, on-chain achievements, and
                    compete with athletes worldwide. Let's get started!
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      100% Free to Start
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      AI-Powered
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>

            {/* Slide 2: AI Coaching */}
            <CarouselItem>
              <Card className="border-2">
                <CardContent className="flex flex-col items-center justify-center p-8 md:p-12 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-2xl opacity-20" />
                    <Brain className="h-20 w-20 text-green-600 relative z-10" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-bold">
                      Real-Time AI Analysis
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      Advanced computer vision meets expert coaching
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Form Analysis</p>
                        <p className="text-xs text-muted-foreground">
                          Real-time pose detection and scoring
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">
                          Multi-AI Coaching
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Insights from Gemini, GPT-4, Claude
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">
                          Instant Feedback
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Voice guidance during your workout
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">Deep Insights</p>
                        <p className="text-xs text-muted-foreground">
                          AWS Bedrock Nova premium analysis
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>

            {/* Slide 3: Blockchain Achievements */}
            <CarouselItem>
              <Card className="border-2">
                <CardContent className="flex flex-col items-center justify-center p-8 md:p-12 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-2xl opacity-20" />
                    <Trophy className="h-20 w-20 text-yellow-600 relative z-10" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-bold">
                      On-Chain Achievements
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      Your fitness records, permanently verified
                    </p>
                  </div>
                  <div className="space-y-4 w-full max-w-xl">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                      <div className="p-3 bg-blue-500 rounded-lg">
                        <Wallet className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Base Sepolia Testnet</p>
                        <p className="text-xs text-muted-foreground">
                          Immutable workout records on blockchain
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                      <div className="p-3 bg-yellow-500 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Global Leaderboard</p>
                        <p className="text-xs text-muted-foreground">
                          Compete with athletes worldwide
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <div className="p-3 bg-green-500 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Verified PRs</p>
                        <p className="text-xs text-muted-foreground">
                          Prove your personal records cryptographically
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>

            {/* Slide 4: Connect Wallet */}
            <CarouselItem>
              <Card className="border-2">
                <CardContent className="flex flex-col items-center justify-center p-8 md:p-12 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-2xl opacity-20" />
                    <Wallet className="h-20 w-20 text-purple-600 relative z-10" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-bold">
                      Ready to Get Started?
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      Connect your wallet to unlock all features
                    </p>
                  </div>
                  <div className="w-full max-w-md space-y-4">
                    <div className="p-6 bg-muted/30 rounded-lg space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Free Features
                        </span>
                        <Badge variant="secondary">No wallet needed</Badge>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Basic AI analysis (Gemini)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Real-time form feedback
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          View leaderboard
                        </li>
                      </ul>
                    </div>
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Connected Benefits</span>
                        <Badge className="bg-blue-600">Unlock Now</Badge>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          On-chain workout records
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          Leaderboard participation
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          Premium analysis ($0.05/workout)
                        </li>
                      </ul>
                    </div>
                    <div className="flex justify-center">
                      <InlineWallet showOnboarding={false} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-2">
              {Array.from({ length: count }).map((_, i) => (
                <button
                  key={i}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === current
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted hover:bg-muted-foreground/30"
                  )}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {current > 0 && (
                <CarouselPrevious className="static translate-y-0" />
              )}
              {!isLastSlide ? (
                <CarouselNext className="static translate-y-0" />
              ) : (
                <Button onClick={onComplete} className="gap-2">
                  Get Started
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Carousel>
      </div>
    </div>
  );
};

export default OnboardingCarousel;
