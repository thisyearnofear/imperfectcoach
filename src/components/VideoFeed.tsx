
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, SwitchCamera } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const VideoFeed = () => {
  const [cameraStatus, setCameraStatus] = useState<"idle" | "pending" | "granted" | "denied">("idle");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraStatus("idle");
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
          <video ref={videoRef} autoPlay playsInline className="w-full h-full rounded-md object-cover" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
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

