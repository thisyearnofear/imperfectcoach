
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, SwitchCamera, Loader2, Timer } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import { useCamera } from "@/hooks/useCamera";
import { useRecording } from "@/hooks/useRecording";
import { Exercise, PoseData, RepData, CoachPersonality, CameraStatus, WorkoutMode } from "@/lib/types";

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
}

const VideoFeed = ({ exercise, onRepCount, onFormFeedback, isDebugMode, onPoseData, onFormScoreUpdate, onNewRepData, coachPersonality, isRecordingEnabled, workoutMode, isWorkoutActive, timeLeft }: VideoFeedProps) => {
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const handleModelFeedback = (message: string) => {
    if (message.includes('Loading')) {
      setModelStatus('loading');
    } else if (message.includes('Ready')) {
      setModelStatus('ready');
    }
    onFormFeedback(message);
  }

  usePoseDetection({
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
    <div className="bg-card p-4 rounded-lg border border-border/40 flex flex-col items-center justify-center aspect-[3/4] md:aspect-video w-full max-w-3xl mx-auto">
      {cameraStatus === "granted" ? (
        <div className="relative w-full h-full">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full rounded-md object-cover" />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full rounded-md" />
          {isWorkoutActive && timeLeft >= 0 && (
             <div className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg flex items-center gap-2 animate-fade-in">
                <Timer className="h-5 w-5" />
                <span className="font-mono text-lg font-semibold">{formatTime(timeLeft)}</span>
            </div>
          )}
          {modelStatus === 'loading' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white rounded-md">
                <Loader2 className="animate-spin h-8 w-8 mb-2" />
                <p className="font-semibold">Loading AI Coach...</p>
            </div>
          )}
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
                  <Button onClick={stopCamera} variant="destructive" size="icon">
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
        <div className="text-center">
          {cameraStatus === "denied" && <p className="text-destructive mb-4">Camera access denied. Please check your browser settings.</p>}
          <Button onClick={() => enableCamera()} disabled={cameraStatus === "pending"}>
            <Video className="mr-2 h-4 w-4" />
            {cameraStatus === 'pending' ? 'Starting Camera...' : 'Enable Camera'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">We need camera access to track your reps.</p>
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
