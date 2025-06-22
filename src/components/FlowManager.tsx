import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Wallet,
  Trophy,
  Zap,
  Shield,
  Users,
  ChevronRight,
  X,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Monitor,
} from "lucide-react";
import { useUser } from "@/hooks/useUserHooks";
import { WalletCard, InlineWallet } from "./UnifiedWallet";
import { cn } from "@/lib/utils";

type FlowStep = "connect" | "authenticate" | "onboard" | "complete";
type DeviceType = "mobile" | "desktop";

interface FlowManagerProps {
  trigger?: React.ReactNode;
  autoStart?: boolean;
  onComplete?: () => void;
  className?: string;
}

const getDeviceType = (): DeviceType => {
  return window.innerWidth < 768 ? "mobile" : "desktop";
};

const OnboardingSteps = ({ deviceType }: { deviceType: DeviceType }) => {
  const steps = [
    {
      icon: <Wallet className="h-5 w-5" />,
      title: "Connect Smart Wallet",
      description: "Link your Coinbase Smart Wallet in seconds",
      feature: "No seed phrases needed",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Authentication",
      description: "Sign in with Ethereum for enhanced security",
      feature: "Industry standard SIWE",
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      title: "Compete Globally",
      description: "Submit scores to permanent blockchain leaderboard",
      feature: "Verifiable achievements",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Track Progress",
      description: "Your fitness journey recorded forever on Base",
      feature: "Immutable records",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-primary">
          Welcome to Blockchain Fitness!
        </h3>
        <p className="text-sm text-muted-foreground">
          Join thousands of athletes competing on the world's first
          decentralized fitness platform
        </p>
      </div>

      <div
        className={cn(
          "space-y-3",
          deviceType === "desktop" && "grid grid-cols-2 gap-3 space-y-0",
        )}
      >
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
          >
            <div className="flex-shrink-0 p-2 rounded-full bg-primary/10 text-primary">
              {step.icon}
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">{step.title}</h4>
              <p className="text-xs text-muted-foreground">
                {step.description}
              </p>
              <Badge variant="secondary" className="text-xs">
                {step.feature}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <Users className="h-4 w-4 text-primary" />
        <AlertDescription className="text-primary/90">
          <strong>Join the community:</strong> Over 10,000 workouts recorded on
          Base blockchain
        </AlertDescription>
      </Alert>
    </div>
  );
};

const FlowContent = ({
  deviceType,
  onComplete,
}: {
  deviceType: DeviceType;
  onComplete?: () => void;
}) => {
  const { isConnected, isAuthenticated, isLoading, displayName } = useUser();

  const [currentStep, setCurrentStep] = useState<FlowStep>("connect");
  const [hasShownOnboarding, setHasShownOnboarding] = useState(false);

  // Determine current step based on state
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentStep("complete");
    } else if (isConnected) {
      setCurrentStep("authenticate");
    } else if (hasShownOnboarding) {
      setCurrentStep("connect");
    } else {
      setCurrentStep("onboard");
    }
  }, [isConnected, isAuthenticated, hasShownOnboarding]);

  // Auto-advance from onboarding
  useEffect(() => {
    if (currentStep === "onboard") {
      const timer = setTimeout(() => {
        setHasShownOnboarding(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Trigger completion callback
  useEffect(() => {
    if (currentStep === "complete" && onComplete) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  const renderStep = () => {
    switch (currentStep) {
      case "onboard":
        return (
          <div className="space-y-6">
            <OnboardingSteps deviceType={deviceType} />
            <Button
              onClick={() => setHasShownOnboarding(true)}
              className="w-full"
              size="lg"
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );

      case "connect":
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Connect your Coinbase Smart Wallet to get started with
                blockchain fitness
              </p>
            </div>
            <InlineWallet showOnboarding={false} />
          </div>
        );

      case "authenticate":
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600 w-fit mx-auto">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Almost There!</h3>
              <p className="text-sm text-muted-foreground">
                Complete authentication to unlock all blockchain features
              </p>
              <Badge variant="outline" className="text-xs">
                Connected as {displayName}
              </Badge>
            </div>
            <InlineWallet showOnboarding={false} />
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Why authenticate?</strong> SIWE provides secure session
                management and enables blockchain score submissions.
              </AlertDescription>
            </Alert>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <div className="p-3 rounded-full bg-green-100 text-green-600 w-fit mx-auto">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-green-700">
                Welcome to the Leaderboard!
              </h3>
              <p className="text-sm text-muted-foreground">
                You're all set to compete and track your progress on Base
                blockchain
              </p>
              <Badge variant="default" className="bg-green-600">
                <Trophy className="h-3 w-3 mr-1" />
                {displayName}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-lg border bg-card/50">
                <div className="text-sm font-medium">Ready to Submit</div>
                <div className="text-xs text-muted-foreground">
                  Workout scores
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-card/50">
                <div className="text-sm font-medium">Global Ranking</div>
                <div className="text-xs text-muted-foreground">
                  Leaderboard access
                </div>
              </div>
            </div>

            <Alert className="border-green-200 bg-green-50">
              <Trophy className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                Start your first workout to begin competing on the blockchain
                leaderboard!
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="max-w-md mx-auto">{renderStep()}</div>;
};

export const FlowManager = ({
  trigger,
  autoStart = false,
  onComplete,
  className,
}: FlowManagerProps) => {
  const [isOpen, setIsOpen] = useState(autoStart);
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const { isAuthenticated } = useUser();

  // Update device type on resize
  useEffect(() => {
    const updateDeviceType = () => setDeviceType(getDeviceType());
    updateDeviceType();
    window.addEventListener("resize", updateDeviceType);
    return () => window.removeEventListener("resize", updateDeviceType);
  }, []);

  // Auto-close when authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isOpen, onComplete]);

  const handleComplete = () => {
    setIsOpen(false);
    onComplete?.();
  };

  const defaultTrigger = (
    <Button variant="outline" className={className}>
      <Wallet className="h-4 w-4 mr-2" />
      Setup Wallet
    </Button>
  );

  const content = (
    <FlowContent deviceType={deviceType} onComplete={handleComplete} />
  );

  // Mobile: Use Sheet
  if (deviceType === "mobile") {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Blockchain Fitness Setup
            </SheetTitle>
            <SheetDescription>
              Connect your wallet to join the global fitness leaderboard
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 pb-6">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Blockchain Fitness Setup
          </DialogTitle>
          <DialogDescription>
            Connect your wallet to join the global fitness leaderboard
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">{content}</div>
      </DialogContent>
    </Dialog>
  );
};

// Convenience components for common use cases
export const WalletOnboardingFlow = () => {
  const { isAuthenticated } = useUser();

  if (isAuthenticated) return null;

  return (
    <FlowManager
      autoStart
      className="w-full"
      trigger={
        <Card className="w-full border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Join Blockchain Leaderboard
            </CardTitle>
            <CardDescription>
              Connect your wallet to compete globally
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  🔥 Live
                </Badge>
                <span>10k+ athletes</span>
              </div>
              <ChevronRight className="h-4 w-4 text-primary" />
            </div>
          </CardContent>
        </Card>
      }
    />
  );
};

export const QuickConnectFlow = ({
  onComplete,
}: {
  onComplete?: () => void;
}) => (
  <FlowManager
    onComplete={onComplete}
    trigger={
      <Button size="sm" variant="outline">
        <Wallet className="h-3 w-3 mr-1" />
        Quick Setup
      </Button>
    }
  />
);
