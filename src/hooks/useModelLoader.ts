
import { useEffect, useRef, useState } from 'react';
import * as posedetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
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
            if (!enabled || detectorRef.current || modelStatus === 'loading' || modelStatus === 'ready') return;
            
            setModelStatus('loading');
            try {
                await tf.setBackend('webgl');
                const detectorConfig = { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
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

        loadModel();
        
        return () => {
            if (detectorRef.current) {
                detectorRef.current.dispose();
                detectorRef.current = null;
            }
        }
    }, [enabled]);

    return { detector: detectorRef.current, modelStatus };
}
