import { useState, useEffect, useCallback } from "react";
import { Exercise, RepData, WorkoutMode, CoachPersonality, JumpRepDetails } from "@/lib/types";
import { getPersonalityFeedback } from "@/lib/coachPersonalities";
import { usePersonalRecords } from "./usePersonalRecords";

const WORKOUT_DURATION = 120; // 2 minutes in seconds

export const useWorkout = (coachPersonality: CoachPersonality = "SNEL") => {
  const [selectedExercise, setSelectedExercise] =
    useState<Exercise>("pull-ups");
  const [reps, setReps] = useState(0);
  const [formFeedback, setFormFeedback] = useState(
    getPersonalityFeedback(coachPersonality, "session_start")
  );
  const [formScore, setFormScore] = useState(100);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [repHistory, setRepHistory] = useState<RepData[]>([]);
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>("training");
  const [timeLeft, setTimeLeft] = useState(WORKOUT_DURATION);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  
  // Personal Records
  const { 
    updatePersonalRecord, 
    getBestReps, 
    getBestFormScore, 
    getBestJumpHeight 
  } = usePersonalRecords();
  
  // Track if we've achieved records in the current session
  const [hasNewRepRecord, setHasNewRepRecord] = useState(false);
  const [hasNewFormRecord, setHasNewFormRecord] = useState(false);
  const [hasNewJumpRecord, setHasNewJumpRecord] = useState(false);

  const endSession = useCallback(() => {
    setIsWorkoutActive(false);
    
    // Update personal records at the end of the session
    if (workoutMode !== "assessment") { // Don't update records in assessment mode
      const jumpHeight = selectedExercise === 'jumps' && repHistory.length > 0 
        ? (repHistory[repHistory.length - 1].details as JumpRepDetails)?.jumpHeight
        : undefined;
        
      const recordResult = updatePersonalRecord(
        selectedExercise, 
        reps, 
        formScore, 
        jumpHeight
      );
      
      setHasNewRepRecord(recordResult.hasNewRepRecord);
      setHasNewFormRecord(recordResult.hasNewFormRecord);
      setHasNewJumpRecord(recordResult.hasNewJumpRecord);
    }
  }, [reps, formScore, selectedExercise, repHistory, workoutMode, updatePersonalRecord]);

  useEffect(() => {
    if (!isWorkoutActive || timeLeft <= 0) {
      if (isWorkoutActive && timeLeft <= 0) {
        endSession();
      }
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isWorkoutActive, timeLeft, endSession]);

  const resetSession = useCallback(() => {
    setReps(0);
    setFormScore(100);
    setSessionStart(null);
    setRepHistory([]);
    setIsWorkoutActive(false);
    setTimeLeft(WORKOUT_DURATION);
    setHasNewRepRecord(false);
    setHasNewFormRecord(false);
    setHasNewJumpRecord(false);
  }, []);

  const handleExerciseChange = useCallback(
    (exercise: Exercise) => {
      if (exercise !== selectedExercise) {
        setSelectedExercise(exercise);
        resetSession();
        setFormFeedback(
          `Switched to ${exercise.replace("-", " ")}. ${getPersonalityFeedback(
            coachPersonality,
            "session_start"
          )}`
        );
      }
    },
    [selectedExercise, resetSession, coachPersonality]
  );

  const handleWorkoutModeChange = useCallback(
    (mode: WorkoutMode) => {
      if (mode === workoutMode) return;

      setWorkoutMode(mode);
      resetSession();

      let initialFeedback;
      if (mode === "assessment") {
        initialFeedback =
          "Assessment mode: Get into position. Scoring starts on your first rep.";
      } else {
        initialFeedback = getPersonalityFeedback(
          coachPersonality,
          "session_start"
        );
      }
      setFormFeedback(initialFeedback);
    },
    [workoutMode, resetSession, selectedExercise, coachPersonality]
  );

  const handleNewRepData = useCallback(
    (data: RepData) => {
      if (!sessionStart) {
        setSessionStart(Date.now() - 2000);
      }
      if (!isWorkoutActive) {
        setIsWorkoutActive(true);
        setTimeLeft(WORKOUT_DURATION);
      }
      
      // Check if this rep sets a new record
      if (reps + 1 > getBestReps(selectedExercise)) {
        setFormFeedback(prev => `${prev} 🏆 New rep record potential!`);
      }
      
      setRepHistory((prev) => [...prev, data]);
      setReps(prev => prev + 1);
    },
    [sessionStart, isWorkoutActive, reps, selectedExercise, getBestReps]
  );

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
    handleNewRepData,
    resetSession,
    endSession,
    // Personal records
    hasNewRepRecord,
    hasNewFormRecord,
    hasNewJumpRecord,
    personalBestReps: getBestReps(selectedExercise),
    personalBestFormScore: getBestFormScore(selectedExercise),
    personalBestJumpHeight: selectedExercise === 'jumps' ? getBestJumpHeight(selectedExercise) : undefined,
  };
};
