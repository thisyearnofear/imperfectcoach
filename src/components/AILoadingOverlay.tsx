
import { useState, useEffect } from "react";
import { Loader2, Eye, Lightbulb, Zap, Heart, Brain } from "lucide-react";
import { Exercise, CoachPersonality } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

interface AILoadingOverlayProps {
  exercise: Exercise;
  coachPersonality: CoachPersonality;
}

interface LoadingPhase {
  duration: number;
  messages: string[];
  icon: React.ReactNode;
  color: string;
}

const AILoadingOverlay = ({ exercise, coachPersonality }: AILoadingOverlayProps) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const getCoachIcon = () => {
    switch (coachPersonality) {
      case "competitive":
        return <Zap className="h-6 w-6 text-orange-500" />;
      case "supportive":
        return <Heart className="h-6 w-6 text-pink-500" />;
      case "zen":
        return <Brain className="h-6 w-6 text-purple-500" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  // ENHANCEMENT: Personality-specific messages for more engaging onboarding
  const getPersonalityMessages = () => {
    switch (coachPersonality) {
      case "competitive":
        return {
          setup: "Ready to dominate? Let's dial in your form!",
          position: "Lock in your position. Precision wins.",
          lighting: "Light it up—can't coach what I can't see!",
          ready: "Alright, you're locked and loaded. Let's go!"
        };
      case "supportive":
        return {
          setup: "You've got this! Let's set up your perfect space.",
          position: "Find your comfortable position. Take your time.",
          lighting: "Good lighting helps me see your amazing form!",
          ready: "Looking great! Whenever you're ready, let's begin."
        };
      case "zen":
        return {
          setup: "Find your center. Let's begin with presence.",
          position: "Center yourself, ground your feet.",
          lighting: "Breathe. Let the light guide us.",
          ready: "Peace and readiness. You're aligned. Begin when ready."
        };
      default:
        return {
          setup: "Let's get you set up!",
          position: "Position yourself properly.",
          lighting: "Check your lighting.",
          ready: "You're ready to start!"
        };
    }
  };

  const personalityMessages = getPersonalityMessages();
  
  const phases: LoadingPhase[] = [
    {
      duration: 12000, // 12 seconds - quick load
      messages: [
        "🤖 Loading AI Coach...",
        "📡 Calibrating sensors...",
        "✨ Almost there..."
      ],
      icon: <Loader2 className="animate-spin h-6 w-6" />,
      color: "text-blue-500"
    },
    {
      duration: 16000, // 16 seconds
      messages: exercise === "pull-ups" ? [
        personalityMessages.setup,
        "Position yourself under the bar",
        "Make sure the bar is visible"
      ] : [
        personalityMessages.setup,
        "Find a clear space to move",
        "Make sure you have room"
      ],
      icon: getCoachIcon(),
      color: "text-emerald-500"
    },
    {
      duration: 14000, // 14 seconds
      messages: [
        personalityMessages.position,
        personalityMessages.lighting,
        "Full body visible in frame"
      ],
      icon: <Eye className="h-6 w-6" />,
      color: "text-amber-500"
    },
    {
      duration: 12000, // 12 seconds - final push
      messages: [
        personalityMessages.ready,
        exercise === "pull-ups" 
          ? "Hang from the bar when ready"
          : "Stand in position when ready",
        "Let's begin!"
      ],
      icon: <Lightbulb className="h-6 w-6" />,
      color: "text-purple-500"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 100);
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);
    const newProgress = Math.min((elapsedTime / totalDuration) * 100, 100);
    setProgress(newProgress);

    // Determine current phase
    let accumulatedTime = 0;
    for (let i = 0; i < phases.length; i++) {
      accumulatedTime += phases[i].duration;
      if (elapsedTime < accumulatedTime) {
        if (currentPhase !== i) {
          setCurrentPhase(i);
          setCurrentMessageIndex(0);
        }
        break;
      }
    }
  }, [elapsedTime, phases, currentPhase]);

  useEffect(() => {
    if (phases[currentPhase]?.messages.length > 1) {
      const messageInterval = setInterval(() => {
        setCurrentMessageIndex(prev => 
          (prev + 1) % phases[currentPhase].messages.length
        );
      }, 3000); // Change message every 3 seconds

      return () => clearInterval(messageInterval);
    }
  }, [currentPhase, phases]);

  const currentPhaseData = phases[currentPhase];
  const currentMessage = currentPhaseData?.messages[currentMessageIndex] || "Loading AI Coach...";

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white rounded-md z-10">
      <div className="max-w-md mx-auto p-8 text-center space-y-6">
        {/* Phase Icon - Larger and more prominent */}
        <div className={`${currentPhaseData?.color || 'text-blue-500'} transition-all duration-300`}>
          <div className={`${currentPhase === phases.length - 1 ? 'animate-bounce' : 'animate-pulse'}`}>
            {currentPhaseData?.icon && <div className="h-12 w-12 mx-auto">{currentPhaseData.icon}</div>}
          </div>
        </div>

        {/* Main Message - Larger, clearer */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold animate-fade-in leading-snug">
            {currentMessage}
          </h2>
          
          {/* Message progression dots */}
          {phases[currentPhase]?.messages.length > 1 && (
            <div className="flex justify-center space-x-2">
              {phases[currentPhase].messages.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentMessageIndex ? 'bg-white w-6' : 'bg-white/40 w-2'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2.5 bg-white/20" />
          <div className="flex justify-between items-center text-xs text-gray-300">
            <span>Checklist {currentPhase + 1}/{phases.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Exercise-specific guidance - More visual */}
        <div className="mt-6 p-4 bg-gradient-to-r from-white/10 to-transparent rounded-lg border border-white/10">
          <p className="text-sm text-gray-200">
            <span className="font-semibold">💡 {exercise === "pull-ups" ? "Pro tip" : "Quick tip"}:</span>{" "}
            {exercise === "pull-ups" 
              ? "Keep your core tight and let momentum carry you. We'll catch any form issues."
              : "Land gently and use your whole body. We're tracking everything!"
            }
          </p>
        </div>

        {/* Coach introduction - Welcoming */}
        <div className="pt-2 text-sm text-gray-300">
          <div className="flex items-center justify-center space-x-2">
            {getCoachIcon()}
            <span className="font-medium">
              {coachPersonality === "competitive" && "Your coach is ready to push you"}
              {coachPersonality === "supportive" && "Your coach is here to support you"}
              {coachPersonality === "zen" && "Your coach is centered and ready"}
              {!["competitive", "supportive", "zen"].includes(coachPersonality) && "Your coach is ready"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILoadingOverlay;
