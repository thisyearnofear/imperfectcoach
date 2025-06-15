
import { useState, useRef, useEffect, useCallback } from 'react';
import { CameraStatus } from '@/lib/types';

interface UseCameraProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onCameraStatusChange?: (status: CameraStatus) => void;
  onCameraError?: (message: string) => void;
}

export const useCamera = ({ videoRef, onCameraStatusChange, onCameraError }: UseCameraProps) => {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | undefined>(undefined);
  const streamRef = useRef<MediaStream | null>(null);

  const updateStatus = useCallback((status: CameraStatus) => {
    setCameraStatus(status);
    onCameraStatusChange?.(status);
  }, [onCameraStatusChange]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
    updateStatus("idle");
    setDevices([]);
    setCurrentDeviceId(undefined);
  }, [updateStatus, videoRef]);

  const enableCamera = useCallback(async (deviceId?: string) => {
    updateStatus("pending");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints = { video: deviceId ? { deviceId: { exact: deviceId } } : true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      updateStatus("granted");

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);
      const activeDeviceId = stream.getVideoTracks()[0].getSettings().deviceId;
      setCurrentDeviceId(activeDeviceId);

    } catch (error) {
      console.error("Error accessing camera:", error);
      updateStatus("denied");
      streamRef.current = null;
    }
  }, [updateStatus]);

  const flipCamera = useCallback(() => {
    if (devices.length > 1 && currentDeviceId) {
      const currentIndex = devices.findIndex(
        (device) => device.deviceId === currentDeviceId
      );
      const nextDevice = devices[(currentIndex + 1) % devices.length];
      enableCamera(nextDevice.deviceId);
    }
  }, [devices, currentDeviceId, enableCamera]);

  useEffect(() => {
    if (cameraStatus === 'granted' && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(err => {
          console.error("Video play failed:", err);
          onCameraError?.("Could not play video feed. Please check browser settings.");
        });
      }
    }
  }, [cameraStatus, videoRef, onCameraError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return { cameraStatus, devices, enableCamera, stopCamera, flipCamera };
};
