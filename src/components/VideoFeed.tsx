
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, SwitchCamera, Timer, Zap, Target, TrendingUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import { useCamera } from "@/hooks/useCamera";
import { useRecording } from "@/hooks/useRecording";
import { Exercise, PoseData, RepData, CoachPersonality, CameraStatus, WorkoutMode, HeightUnit } from "@/lib/types";
import { formatHeight } from "@/lib/heightConversion";
import AILoadingOverlay from "@/components/AILoadingOverlay";

interface VideoFeedProps {
  exercise: Exercise;
  onRepCount: (update: (prev: number) => number) => void;
  onFormFeedback: (message: string) => void;
  isDebugMode: boolean;
  onPoseData: (data: PoseData | null) => void;
  onFormScoreUpdate: (score: number) => void;
  onNewRepData: (data: RepData) => void;
  coachPersonality: CoachPersonality;
  isRecordingEnabled: boolean;
  workoutMode: WorkoutMode;
  isWorkoutActive: boolean;
  timeLeft: number;
  onSessionEnd: () => void;
  onSessionReset: () => void;
  heightUnit: HeightUnit;
}

const VideoFeed = ({ exercise, onRepCount, onFormFeedback, isDebugMode, onPoseData, onFormScoreUpdate, onNewRepData, coachPersonality, isRecordingEnabled, workoutMode, isWorkoutActive, timeLeft, onSessionEnd, onSessionReset, heightUnit }: VideoFeedProps) => {
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [valuePropIndex, setValuePropIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const valueProps = [
    { text: "Real-time AI Coaching", icon: Zap },
    { text: "Perfect Your Form", icon: Target },
    { text: "Track Progress", icon: TrendingUp }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setValuePropIndex((prev) => (prev + 1) % valueProps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const onCameraStatusChange = useCallback((status: CameraStatus) => {
    if (status === 'idle' || status === 'denied') {
        setModelStatus('idle');
    }
  }, []);

  const { cameraStatus, devices, enableCamera, stopCamera, flipCamera } = useCamera({ 
    videoRef, 
    onCameraStatusChange,
    onCameraError: onFormFeedback
  });

  const { isRecording, toggleRecording } = useRecording({ 
    videoRef, 
    canvasRef, 
    onRecordingError: onFormFeedback 
  });

  const handleStopCamera = () => {
    stopCamera();
    onSessionEnd();
  };

  const handleEnableCamera = () => {
    onSessionReset();
    enableCamera();
  };

  const handleModelFeedback = (message: string) => {
    if (message.includes('Loading')) {
      setModelStatus('loading');
    } else if (message.includes('Ready')) {
      setModelStatus('ready');
    }
    onFormFeedback(message);
  }

  const { currentJumpHeight, jumpGroundLevel } = usePoseDetection({
    videoRef,
    cameraStatus,
    exercise,
    onRepCount,
    onFormFeedback: handleModelFeedback,
    canvasRef,
    isDebugMode,
    onPoseData,
    onFormScoreUpdate,
    onNewRepData,
    coachPersonality,
    workoutMode,
    isWorkoutActive,
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="bg-card p-4 rounded-lg border border-border/40 flex flex-col items-center justify-center aspect-[4/3] lg:aspect-video w-full">
      {cameraStatus === "granted" ? (
        <div className="relative w-full h-full">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full rounded-md object-cover" />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full rounded-md" />
          
          {/* Timer */}
          {isWorkoutActive && timeLeft >= 0 && (
             <div className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg flex items-center gap-2 animate-fade-in">
                <Timer className="h-5 w-5" />
                <span className="font-mono text-lg font-semibold">{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* Jump Height Display for Jumps Exercise */}
          {exercise === 'jumps' && jumpGroundLevel && isWorkoutActive && (
            <div className="absolute top-2 left-2 bg-black/50 text-white p-2 rounded-lg animate-fade-in">
              <div className="text-xs text-gray-300">Jump Height</div>
              <div className={`text-lg font-bold ${currentJumpHeight > 0 ? 'text-green-400 animate-pulse' : 'text-white'}`}>
                {formatHeight(currentJumpHeight, heightUnit)}
              </div>
            </div>
          )}

          {/* Enhanced Loading overlay */}
          {modelStatus === 'loading' && (
            <AILoadingOverlay 
              exercise={exercise}
              coachPersonality={coachPersonality}
            />
          )}

          {/* Controls */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <TooltipProvider>
              {isRecordingEnabled && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={toggleRecording} variant={isRecording ? "destructive" : "secondary"} size="icon">
                      {isRecording ? <div className="h-3 w-3 rounded-sm bg-white animate-pulse" /> : <Video className="h-4 w-4" />}
                      <span className="sr-only">{isRecording ? "Stop Recording" : "Start Recording"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isRecording ? "Stop Recording" : "Start Recording"}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleStopCamera} variant="destructive" size="icon">
                    <VideoOff />
                    <span className="sr-only">Stop Camera</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Stop Camera</p>
                </TooltipContent>
              </Tooltip>
              {devices.length > 1 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={flipCamera} variant="secondary" size="icon">
                      <SwitchCamera />
                      <span className="sr-only">Flip Camera</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Flip Camera</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>
      ) : (
        <div className="text-center relative">
          {cameraStatus === "denied" && <p className="text-destructive mb-4">Camera access denied. Please check your browser settings.</p>}

          {/* Cycling value propositions */}
          <div className="mb-6 relative h-8 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={valuePropIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                {(() => {
                  const Icon = valueProps[valuePropIndex].icon;
                  return <Icon className="h-4 w-4" />;
                })()}
                <span>{valueProps[valuePropIndex].text}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleEnableCamera}
              disabled={cameraStatus === "pending"}
              className="relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
              <Video className="mr-2 h-4 w-4 relative z-10" />
              <span className="relative z-10">
                {cameraStatus === 'pending' ? 'Starting Camera...' : 'Start'}
              </span>
            </Button>
          </motion.div>
          <p className="text-xs text-muted-foreground mt-2">We need camera access to track your reps.</p>
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
