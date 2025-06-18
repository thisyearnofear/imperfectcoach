
import { useEffect, useRef, useState, useCallback } from 'react';
import { Exercise, RepState } from '@/lib/types';
import { useAudioFeedback } from './useAudioFeedback';

interface UseExerciseStateProps {
    exercise: Exercise;
    onRepCount: (count: (prevCount: number) => number) => void;
}

export const useExerciseState = ({ exercise, onRepCount }: UseExerciseStateProps) => {
    const repState = useRef<RepState>('DOWN');
    const [internalReps, setInternalReps] = useState(0);
    const lastRepIssues = useRef<string[]>([]);
    const repScores = useRef<number[]>([]);
    const jumpGroundLevel = useRef<number | null>(null);
    const peakAirborneY = useRef<number | null>(null);
    const currentRepAngles = useRef<{ left: number[], right: number[] }>({ left: [], right: [] });
    const calibrationFrames = useRef<number>(0);

    const { playBeep } = useAudioFeedback();

    useEffect(() => {
        setInternalReps(0);
        repScores.current = [];
        lastRepIssues.current = [];
        jumpGroundLevel.current = null;
        peakAirborneY.current = null;
        currentRepAngles.current = { left: [], right: [] };
        calibrationFrames.current = 0;

        if (exercise === 'pull-ups') {
            repState.current = 'DOWN';
        } else if (exercise === 'jumps') {
            repState.current = 'GROUNDED';
        }
    }, [exercise]);

    const incrementReps = useCallback(() => {
        onRepCount(prev => prev + 1);
        setInternalReps(prev => prev + 1);
        playBeep();
    }, [onRepCount, playBeep]);
    
    return {
        repState,
        internalReps,
        lastRepIssues,
        repScores,
        jumpGroundLevel,
        peakAirborneY,
        currentRepAngles,
        calibrationFrames,
        incrementReps
    };
};
