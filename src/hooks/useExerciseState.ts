
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
    // ENHANCEMENT: Track streak of reps with good form (60+ score)
    const formStreak = useRef<number>(0);
    // Track if reps have started to differentiate first session from restart
    const sessionStarted = useRef<boolean>(false);

    const { playBeep } = useAudioFeedback();

    // Reset function to clear state for a new session
    const resetExerciseState = useCallback(() => {
        setInternalReps(0);
        repScores.current = [];
        lastRepIssues.current = [];
        jumpGroundLevel.current = null;
        peakAirborneY.current = null;
        currentRepAngles.current = { left: [], right: [] };
        calibrationFrames.current = 0;
        formStreak.current = 0;
        sessionStarted.current = false;

        if (exercise === 'pull-ups') {
            repState.current = 'DOWN';
        } else if (exercise === 'jumps') {
            repState.current = 'GROUNDED';
        }
    }, [exercise]);

    // Reset when exercise changes
    useEffect(() => {
        resetExerciseState();
    }, [exercise, resetExerciseState]);

    const incrementReps = useCallback(() => {
        onRepCount(prev => prev + 1);
        setInternalReps(prev => prev + 1);
        playBeep();
    }, [onRepCount, playBeep]);

    // ENHANCEMENT: Update streak based on latest rep score
    const updateFormStreak = useCallback((score: number) => {
        if (score >= 60) {
            formStreak.current++;
        } else {
            formStreak.current = 0;
        }
    }, []);
    
    return {
        repState,
        internalReps,
        lastRepIssues,
        repScores,
        jumpGroundLevel,
        peakAirborneY,
        currentRepAngles,
        calibrationFrames,
        incrementReps,
        formStreak: formStreak.current,
        updateFormStreak,
        resetExerciseState
    };
};
