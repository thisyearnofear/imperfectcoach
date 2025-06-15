import { useState, useEffect, useRef } from "react";
import { PoseData, CoachPersonality, CoachModel, SessionSummaries, ChatMessage } from '@/lib/types';
import { useAchievements } from "@/hooks/useAchievements";
import { useAudioFeedback } from "@/hooks/useAudioFeedback";
import { useWorkout } from "@/hooks/useWorkout";
import { usePerformanceStats } from "@/hooks/usePerformanceStats";
import { useAIFeedback } from "@/hooks/useAIFeedback";

export const useIndexPage = () => {
  // UI and settings state
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const [coachPersonality, setCoachPersonality] = useState<CoachPersonality>("competitive");
  const [coachModel, setCoachModel] = useState<CoachModel>('gemini');
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
  const [isAudioFeedbackEnabled, setIsAudioFeedbackEnabled] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummaries | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [selectedCoaches, setSelectedCoaches] = useState<CoachModel[]>(['gemini']);
  const [sessionHasConcluded, setSessionHasConcluded] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

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
  } = useWorkout();

  const analyticsRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Other hooks
  const { repTimings, sessionDuration } = usePerformanceStats(repHistory, sessionStart);
  const { achievements } = useAchievements(reps, repHistory, formScore, repTimings.stdDev);
  const { speak } = useAudioFeedback();
  const { getAISessionSummary, getAIChatResponse } = useAIFeedback({
    exercise: selectedExercise,
    coachPersonality,
    workoutMode,
    onFormFeedback: setFormFeedback
  });
  const wasWorkoutActive = useRef(isWorkoutActive);

  const handleTryAgain = () => {
    resetSession();
    setIsAnalyticsOpen(false);
    setSessionHasConcluded(false);
    setChatMessages([]);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Effects
  useEffect(() => {
    // When workout ends, open analytics if reps were done
    if (wasWorkoutActive.current && !isWorkoutActive && repHistory.length > 0) {
      setFormFeedback("Time's up! Great session. Here's your summary.");
      setIsAnalyticsOpen(true);
      setSessionHasConcluded(true);
      setTimeout(() => analyticsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
    wasWorkoutActive.current = isWorkoutActive;
  }, [isWorkoutActive, repHistory.length, setFormFeedback, analyticsRef]);

  useEffect(() => {
    if (sessionHasConcluded && repHistory.length > 0) {
      setIsSummaryLoading(true);
      getAISessionSummary({
        reps,
        averageFormScore: formScore,
        repHistory,
      }, selectedCoaches).then(summaries => {
          setSessionSummaries(summaries);
          setIsSummaryLoading(false);
      });
    } else {
        setSessionSummaries(null);
        setIsSummaryLoading(false);
    }
  }, [sessionHasConcluded, selectedCoaches, getAISessionSummary, repHistory, reps, formScore]);

  useEffect(() => {
    if (isAudioFeedbackEnabled && formFeedback) {
      if (formFeedback.includes("Enable your camera") || formFeedback.includes("Model loaded")) return;
      speak(formFeedback);
    }
  }, [formFeedback, isAudioFeedbackEnabled, speak]);
  
  useEffect(() => {
    const root = document.documentElement;
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const handleCoachModelChange = (model: CoachModel) => {
    setCoachModel(model);
    const modelName = model.charAt(0).toUpperCase() + model.slice(1);
    setFormFeedback(`Switched to Coach ${modelName}. Ready when you are!`);
  };

  const handleSendMessage = async (message: string, model: CoachModel) => {
    if (!message.trim()) return;

    const newUserMessage: ChatMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, newUserMessage]);
    setIsChatLoading(true);

    const fullHistory = [...chatMessages, newUserMessage];

    const response = await getAIChatResponse(
        fullHistory,
        {
            reps,
            averageFormScore: formScore,
            repHistory,
        },
        model
    );

    const newAssistantMessage: ChatMessage = { role: 'assistant', content: response };
    setChatMessages(prev => [...prev, newAssistantMessage]);
    setIsChatLoading(false);
  };

  return {
    // State
    isDebugMode, isRecordingEnabled, poseData, coachPersonality, coachModel, 
    isMobileSettingsOpen, isAudioFeedbackEnabled, isHighContrast, isAnalyticsOpen,
    sessionSummaries, isSummaryLoading, selectedCoaches, selectedExercise, reps,
    formFeedback, formScore, repHistory, workoutMode, timeLeft, isWorkoutActive,
    repTimings, sessionDuration, achievements, analyticsRef, topRef,
    chatMessages, isChatLoading,
    // Setters
    setIsDebugMode, setIsRecordingEnabled, setPoseData, setCoachPersonality,
    setIsMobileSettingsOpen, setIsAudioFeedbackEnabled, setIsHighContrast, setIsAnalyticsOpen,
    setSelectedCoaches, setReps, setFormFeedback, setFormScore,
    // Handlers
    handleCoachModelChange, handleExerciseChange, handleWorkoutModeChange,
    handleNewRepData, resetSession, endSession, handleTryAgain, handleSendMessage,
  };
};
