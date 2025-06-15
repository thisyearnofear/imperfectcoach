
import { useState, useRef } from 'react';

interface UseRecordingProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    onRecordingError: (message: string) => void;
}

export const useRecording = ({ videoRef, canvasRef, onRecordingError }: UseRecordingProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    const startRecording = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;

        const videoStream = (videoElement as any).captureStream();
        const canvasStream = (canvasElement as any).captureStream();
        
        const combinedStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...canvasStream.getVideoTracks(),
        ]);
        
        recordedChunksRef.current = [];
        const mimeType = ['video/webm; codecs=vp9', 'video/webm; codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
        
        if (!mimeType) {
            onRecordingError("Recording is not supported on your browser.");
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
    
    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return { isRecording, toggleRecording };
};
