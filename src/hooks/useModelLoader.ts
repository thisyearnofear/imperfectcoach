
import { useEffect, useRef, useState } from 'react';
import * as posedetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import { toast } from 'sonner';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * A hook to load and manage the TensorFlow.js pose detection model.
 * @param enabled - Whether the model should be loaded.
 * @returns The detector instance and the current model status.
 */
export const useModelLoader = (enabled: boolean) => {
    const detectorRef = useRef<posedetection.PoseDetector | null>(null);
    const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');

    useEffect(() => {
        const loadModel = async () => {
            // Don't load if already loading or ready
            if (modelStatus !== 'idle') return;
            
            // Don't reload if detector already exists
            if (detectorRef.current) {
                setModelStatus('ready');
                return;
            }
            
            setModelStatus('loading');
            try {
                try {
                    await tf.setBackend('webgl');
                } catch (e) {
                    console.warn("WebGL backend not available, falling back to CPU.", e);
                    toast.info("AI Coach may run slower", {
                        description: "3D acceleration (WebGL) is not available, using CPU instead.",
                    });
                    await tf.setBackend('cpu');
                }

                // Configuration for the MoveNet model.
                //SINGLEPOSE_LIGHTNING is fast and lightweight.
                // For performance tuning, we can experiment with different runtimes and model-specific settings.
                const detectorConfig = { 
                  modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                  // runtime: 'tfjs', // or 'mediapipe'
                  // modelConfig: {
                  //   enableSmoothing: false // Disable smoothing if we are doing our own.
                  // }
                };
                const detector = await posedetection.createDetector(posedetection.SupportedModels.MoveNet, detectorConfig);
                detectorRef.current = detector;
                setModelStatus('ready');
            } catch (error) {
                console.error("Failed to load pose detection model:", error);
                setModelStatus('error');
                toast.error("AI Coach failed to load", {
                    description: "There was a problem loading the pose detection model.",
                    duration: 10000,
                });
            }
        };

        if (enabled) {
            loadModel();
        } else {
            // Cleanup: dispose model and reset state when disabled
            if (detectorRef.current) {
                detectorRef.current.dispose();
                detectorRef.current = null;
            }
            setModelStatus('idle');
        }
        
        return () => {
            // Cleanup on unmount
            if (detectorRef.current) {
                detectorRef.current.dispose();
                detectorRef.current = null;
            }
        }
    }, [enabled]);

    return { detector: detectorRef.current, modelStatus };
}
