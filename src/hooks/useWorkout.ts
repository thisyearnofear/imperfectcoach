
import { useState, useEffect, useCallback } from 'react';
import { Exercise, RepData, WorkoutMode } from '@/lib/types';

const WORKOUT_DURATION = 120; // 2 minutes in seconds

export const useWorkout = () => {
    const [selectedExercise, setSelectedExercise] = useState<Exercise>("pull-ups");
    const [reps, setReps] = useState(0);
    const [formFeedback, setFormFeedback] = useState(
        "Enable your camera and select an exercise to begin. Let's see what you've got!"
    );
    const [formScore, setFormScore] = useState(100);
    const [sessionStart, setSessionStart] = useState<number | null>(null);
    const [repHistory, setRepHistory] = useState<RepData[]>([]);
    const [workoutMode, setWorkoutMode] = useState<WorkoutMode>('training');
    const [timeLeft, setTimeLeft] = useState(WORKOUT_DURATION);
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);

    useEffect(() => {
        if (!isWorkoutActive || timeLeft <= 0) {
            if (isWorkoutActive && timeLeft <= 0) {
                setFormFeedback("Time's up! Great session!");
                setIsWorkoutActive(false);
            }
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [isWorkoutActive, timeLeft, setFormFeedback]);

    const resetSession = useCallback(() => {
        setReps(0);
        setFormScore(100);
        setSessionStart(null);
        setRepHistory([]);
        setIsWorkoutActive(false);
        setTimeLeft(WORKOUT_DURATION);
    }, []);

    const handleExerciseChange = useCallback((exercise: Exercise) => {
        if (exercise !== selectedExercise) {
            setSelectedExercise(exercise);
            resetSession();
            let initialFeedback = `Switched to ${exercise}. Let's get to it!`;
            if (exercise === 'pull-ups') {
                initialFeedback = "To begin, hang from the bar with arms fully extended.";
            } else if (exercise === 'jumps') {
                initialFeedback = "To begin, stand still in full view of the camera.";
            }
            setFormFeedback(initialFeedback);
        }
    }, [selectedExercise, resetSession]);

    const handleWorkoutModeChange = useCallback((mode: WorkoutMode) => {
        if (mode === workoutMode) return;

        setWorkoutMode(mode);
        resetSession();
        
        let initialFeedback;
        if (mode === 'assessment') {
            initialFeedback = "Assessment mode: Your form will be scored without coaching.";
        } else {
            if (selectedExercise === 'pull-ups') {
                initialFeedback = "To begin, hang from the bar with arms fully extended.";
            } else if (selectedExercise === 'jumps') {
                initialFeedback = "To begin, stand still in full view of the camera.";
            } else {
                initialFeedback = `Training mode: Switched to ${selectedExercise}. Let's get to it!`;
            }
        }
        setFormFeedback(initialFeedback);
    }, [workoutMode, resetSession, selectedExercise]);
    
    const handleNewRepData = useCallback((data: RepData) => {
        if (!sessionStart) {
            setSessionStart(Date.now() - 2000);
        }
        if (!isWorkoutActive) {
            setIsWorkoutActive(true);
            setTimeLeft(WORKOUT_DURATION);
        }
        setRepHistory((prev) => [...prev, data]);
    }, [sessionStart, isWorkoutActive]);

    return {
        selectedExercise,
        reps,
        formFeedback,
        formScore,
        sessionStart,
        repHistory,
        workoutMode,
        timeLeft,
        isWorkoutActive,
        setReps,
        setFormFeedback,
        setFormScore,
        handleExerciseChange,
        handleWorkoutModeChange,
        handleNewRepData
    };
};
