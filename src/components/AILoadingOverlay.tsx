
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

  const getPersonalityTone = (baseMessage: string): string => {
    switch (coachPersonality) {
      case "competitive":
        return baseMessage.replace("Let's", "Let's dominate this!").replace("Ready", "Ready to crush it");
      case "supportive":
        return baseMessage.replace("crush", "enjoy").replace("dominate", "do our best");
      case "zen":
        return baseMessage.replace("Let's", "Let's mindfully").replace("crush", "flow through");
      default:
        return baseMessage;
    }
  };

  const phases: LoadingPhase[] = [
    {
      duration: 15000, // 15 seconds
      messages: [
        "Initializing AI Coach...",
        "Loading pose detection models...",
        "Calibrating movement sensors..."
      ],
      icon: <Loader2 className="animate-spin h-6 w-6" />,
      color: "text-blue-500"
    },
    {
      duration: 15000, // 15 seconds
      messages: exercise === "pull-ups" ? [
        "Get ready for pull-ups! Position yourself under the bar",
        "Make sure the bar is visible in your camera view",
        "Stand with your arms relaxed at your sides to start"
      ] : [
        "Get ready for jumps! Find a clear space",
        "Make sure you have room to jump safely",
        "Stand with your feet shoulder-width apart"
      ],
      icon: getCoachIcon(),
      color: "text-green-500"
    },
    {
      duration: 15000, // 15 seconds
      messages: [
        "Ensure you have good lighting so I can see you clearly!",
        "Position yourself 3-6 feet from the camera",
        "Make sure your full body is visible in the frame"
      ],
      icon: <Eye className="h-6 w-6" />,
      color: "text-yellow-500"
    },
    {
      duration: 15000, // 15 seconds
      messages: [
        getPersonalityTone("Almost ready! Let's crush this workout!"),
        getPersonalityTone("I'll track your form and count your reps"),
        getPersonalityTone("Ready to see what you've got!")
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
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white rounded-md z-10">
      <div className="max-w-md mx-auto p-6 text-center space-y-6">
        {/* Icon and Phase Indicator */}
        <div className="flex flex-col items-center space-y-4">
          <div className={`${currentPhaseData?.color || 'text-blue-500'} animate-pulse`}>
            {currentPhaseData?.icon}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full max-w-xs">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-300 mt-1">
              Phase {currentPhase + 1} of {phases.length}
            </p>
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold animate-fade-in">
            {currentMessage}
          </h3>
          
          {/* Message dots indicator */}
          {phases[currentPhase]?.messages.length > 1 && (
            <div className="flex justify-center space-x-1">
              {phases[currentPhase].messages.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                    index === currentMessageIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Exercise-specific tip */}
        <div className="text-sm text-gray-300 bg-white/10 rounded-lg p-3">
          <strong>Pro Tip:</strong> {exercise === "pull-ups" 
            ? "Keep your core engaged and avoid swinging for the best form!" 
            : "Land softly on your feet and use your arms for momentum!"
          }
        </div>

        {/* Coach personality indicator */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
          {getCoachIcon()}
          <span>Coach {coachPersonality.charAt(0).toUpperCase() + coachPersonality.slice(1)} is getting ready</span>
        </div>
      </div>
    </div>
  );
};

export default AILoadingOverlay;
