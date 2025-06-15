import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, SwitchCamera, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import { Exercise, PoseData, RepData, CoachPersonality } from "@/lib/types";

interface VideoFeedProps {
  exercise: Exercise;
  onRepCount: (update: (prev: number) => number) => void;
  onFormFeedback: (message: string) => void;
  isDebugMode: boolean;
  onPoseData: (data: PoseData) => void;
  onFormScoreUpdate: (score: number) => void;
  onNewRepData: (data: RepData) => void;
  coachPersonality: CoachPersonality;
  isRecordingEnabled: boolean;
}

const VideoFeed = ({ exercise, onRepCount, onFormFeedback, isDebugMode, onPoseData, onFormScoreUpdate, onNewRepData, coachPersonality, isRecordingEnabled }: VideoFeedProps) => {
  const [cameraStatus, setCameraStatus] = useState<"idle" | "pending" | "granted" | "denied">("idle");
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

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
  });

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraStatus("idle");
    setModelStatus("idle");
    setDevices([]);
    setCurrentDeviceId(undefined);
  };

  const enableCamera = async (deviceId?: string) => {
    setCameraStatus("pending");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints = { video: deviceId ? { deviceId: { exact: deviceId } } : true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraStatus("granted");

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);
      setCurrentDeviceId(stream.getVideoTracks()[0].getSettings().deviceId);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraStatus("denied");
      if (streamRef.current) {
        streamRef.current = null;
      }
      setModelStatus("idle");
    }
  };

  const flipCamera = () => {
    if (devices.length > 1 && currentDeviceId) {
      const currentIndex = devices.findIndex(
        (device) => device.deviceId === currentDeviceId
      );
      const nextDevice = devices[(currentIndex + 1) % devices.length];
      enableCamera(nextDevice.deviceId);
    }
  };

  const startRecording = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const videoStream = (videoRef.current as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream();
    const canvasStream = (canvasRef.current as HTMLCanvasElement & { captureStream: () => MediaStream }).captureStream();
    
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...canvasStream.getVideoTracks(),
    ]);
    
    recordedChunksRef.current = [];
    // Use a common codec if available
    const mimeType = ['video/webm; codecs=vp9', 'video/webm; codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) {
        onFormFeedback("Recording is not supported on your browser.");
        return;
    }
    const options = { mimeType };
    mediaRecorderRef.current = new MediaRecorder(combinedStream, options);

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      a.href = url;
      a.download = `workout-session-${new Date().toISOString().slice(0, 10)}.webm`;
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="bg-card p-4 rounded-lg border border-border/40 flex flex-col items-center justify-center aspect-video w-full max-w-3xl mx-auto">
      {cameraStatus === "granted" ? (
        <div className="relative w-full h-full">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full rounded-md object-cover" />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full rounded-md" />
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
                    <Button onClick={handleRecordClick} variant={isRecording ? "destructive" : "secondary"} size="icon">
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
