import { useRef, useState, useCallback } from 'react';
import { PoseReadinessSystem, ReadinessScore, ReadinessConfig } from '@/lib/pose-readiness/ReadinessSystem';
import * as posedetection from '@tensorflow-models/pose-detection';

export const usePoseReadiness = (config: ReadinessConfig) => {
    const readinessSystem = useRef(new PoseReadinessSystem(config));
    const [currentReadiness, setCurrentReadiness] = useState<ReadinessScore | null>(null);
    
    const analyzeReadiness = useCallback((
        keypoints: posedetection.Keypoint[], 
        videoDimensions: { width: number, height: number }
    ) => {
        const readinessScore = readinessSystem.current.analyzePoseReadiness(keypoints, videoDimensions);
        setCurrentReadiness(readinessScore);
        return readinessScore;
    }, []);
    
    const reset = useCallback(() => {
        readinessSystem.current.reset();
        setCurrentReadiness(null);
    }, []);
    
    return {
        analyzeReadiness,
        currentReadiness,
        reset,
        canProceed: currentReadiness?.canProceed ?? false,
        readinessLevel: currentReadiness?.overall ?? 'POOR'
    };
};