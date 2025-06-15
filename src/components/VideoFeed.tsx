
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

const VideoFeed = () => {
  const [cameraStatus, setCameraStatus] = useState<"idle" | "pending" | "granted" | "denied">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);

  const enableCamera = async () => {
    setCameraStatus("pending");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStatus("granted");
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraStatus("denied");
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup: stop video stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="bg-card p-4 rounded-lg border border-border/40 flex flex-col items-center justify-center aspect-video w-full max-w-3xl mx-auto">
      {cameraStatus === "granted" ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full rounded-md object-cover" />
      ) : (
        <div className="text-center">
          {cameraStatus === "denied" && <p className="text-destructive mb-4">Camera access denied. Please check your browser settings.</p>}
          <Button onClick={enableCamera} disabled={cameraStatus === "pending"}>
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
