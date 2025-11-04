import { useState, useEffect, useRef } from "react";
import {
  PoseData,
  CoachPersonality,
  HeightUnit,
} from "@/lib/types";
import { useAchievements } from "@/hooks/useAchievements";
import { useAudioFeedback } from "@/hooks/useAudioFeedback";
import { useWorkout } from "@/hooks/useWorkout";
import { usePerformanceStats } from "@/hooks/usePerformanceStats";

export const useIndexPage = () => {
  // UI and settings state
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const [coachPersonality, setCoachPersonality] =
    useState<CoachPersonality>("RASTA");
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
  const [isAudioFeedbackEnabled, setIsAudioFeedbackEnabled] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const [sessionHasConcluded, setSessionHasConcluded] = useState(false);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(() => {
    const saved = localStorage.getItem("heightUnit");
    return (saved as HeightUnit) || "cm";
  });

  // Workout state managed by custom hook
  const {
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
    hasNewRepRecord,
    hasNewFormRecord,
    hasNewJumpRecord,
    personalBestReps,
    personalBestFormScore,
    personalBestJumpHeight,
  } = useWorkout(coachPersonality);

  const analyticsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Other hooks
  const { repTimings, sessionDuration } = usePerformanceStats(
    repHistory,
    sessionStart
  );
  const { achievements } = useAchievements(
    reps,
    repHistory,
    formScore,
    repTimings.stdDev
  );
  const { speak } = useAudioFeedback();
  const wasWorkoutActive = useRef(isWorkoutActive);

  // Missing state variables that were referenced but not defined
  const [sessionSummaries, setSessionSummaries] = useState<any>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [selectedCoaches, setSelectedCoaches] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const handleTryAgain = () => {
    resetSession();
    setIsAnalyticsOpen(false);
    setSessionHasConcluded(false);
    setChatMessages([]);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleHeightUnitChange = (unit: HeightUnit) => {
    setHeightUnit(unit);
    localStorage.setItem("heightUnit", unit);
  };

  // Effects
  useEffect(() => {
    // When workout ends, open analytics if reps were done
    if (wasWorkoutActive.current && !isWorkoutActive && repHistory.length > 0) {
      setFormFeedback("Time's up! Great session. Here's your summary.");
      setIsAnalyticsOpen(true);
      setSessionHasConcluded(true);
      setTimeout(
        () =>
          analyticsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        300
      );
    }
    wasWorkoutActive.current = isWorkoutActive;
  }, [isWorkoutActive, repHistory.length, setFormFeedback, analyticsRef]);

  // AI summary generation moved to PostWorkoutFlow component to avoid duplication

  useEffect(() => {
    if (isAudioFeedbackEnabled && formFeedback) {
      if (
        formFeedback.includes("Enable your camera") ||
        formFeedback.includes("Model loaded")
      )
        return;
      speak(formFeedback);
    }
  }, [formFeedback, isAudioFeedbackEnabled, speak]);

  useEffect(() => {
    const root = document.documentElement;
    if (isHighContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
  }, [isHighContrast]);

  return {
    // State
    isDebugMode,
    isRecordingEnabled,
    poseData,
    coachPersonality,
    isMobileSettingsOpen,
    isAudioFeedbackEnabled,
    isHighContrast,
    isAnalyticsOpen,
    isFocusMode,
    sessionSummaries,
    isSummaryLoading,
    selectedCoaches,
    selectedExercise,
    reps,
    formFeedback,
    formScore,
    repHistory,
    workoutMode,
    timeLeft,
    isWorkoutActive,
    repTimings,
    sessionDuration,
    achievements,
    analyticsRef,
    topRef,
    heightUnit,
    sessionHasConcluded,
    hasNewRepRecord,
    hasNewFormRecord,
    hasNewJumpRecord,
    personalBestReps,
    personalBestFormScore,
    personalBestJumpHeight,
    // Setters
    setIsDebugMode,
    setIsRecordingEnabled,
    setPoseData,
    setCoachPersonality,
    setIsMobileSettingsOpen,
    setIsAudioFeedbackEnabled,
    setIsHighContrast,
    setIsAnalyticsOpen,
    setIsFocusMode,
    setReps,
    setFormFeedback,
    setFormScore,
    handleHeightUnitChange,
    // Handlers
    handleExerciseChange,
    handleWorkoutModeChange,
    handleNewRepData,
    resetSession,
    endSession,
    handleTryAgain,
  };
};
