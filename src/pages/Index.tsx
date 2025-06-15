import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import VideoFeed from "@/components/VideoFeed";
import CoachFeedback from "@/components/CoachFeedback";
import { Button } from "@/components/ui/button";
import { BarChart2 as AnalyticsIcon, Settings } from "lucide-react";
import DebugPanel from "@/components/DebugPanel";
import { PoseData, CoachPersonality, CoachModel, SessionSummaries } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import PerformanceAnalytics from "@/components/PerformanceAnalytics";
import { useAchievements } from "@/hooks/useAchievements";
import UnlockedAchievements from "@/components/UnlockedAchievements";
import MobileControls from "@/components/MobileControls";
import { useAudioFeedback } from "@/hooks/useAudioFeedback";
import { useWorkout } from "@/hooks/useWorkout";
import DesktopControls from "@/components/DesktopControls";
import { usePerformanceStats } from "@/hooks/usePerformanceStats";
import { useAIFeedback } from "@/hooks/useAIFeedback";
import { CoachSummarySelector } from "@/components/CoachSummarySelector";

const Index = () => {
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

  // Other hooks
  const { repTimings, sessionDuration } = usePerformanceStats(repHistory, sessionStart);
  const { achievements } = useAchievements(reps, repHistory, formScore, repTimings.stdDev);
  const { speak } = useAudioFeedback();
  const { getAISessionSummary } = useAIFeedback({
    exercise: selectedExercise,
    coachPersonality,
    workoutMode,
    onFormFeedback: setFormFeedback
  });
  const wasWorkoutActive = useRef(isWorkoutActive);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const scrollToAnalytics = () => {
    analyticsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Effects
  useEffect(() => {
    // When workout ends, open analytics if reps were done
    if (wasWorkoutActive.current && !isWorkoutActive && repHistory.length > 0) {
      setFormFeedback("Time's up! Great session. Here's your summary.");
      setIsAnalyticsOpen(true);
      
      setIsSummaryLoading(true);
      setSessionSummaries(null);
      getAISessionSummary({
        reps,
        averageFormScore: formScore,
        repHistory,
      }, selectedCoaches).then(summaries => {
          setSessionSummaries(summaries);
          setIsSummaryLoading(false);
      });

      setTimeout(() => scrollToAnalytics(), 300);
    } else if (!isWorkoutActive && repHistory.length === 0) {
      setSessionSummaries(null);
      setIsSummaryLoading(false);
    }
    wasWorkoutActive.current = isWorkoutActive;
  }, [isWorkoutActive, repHistory.length, setFormFeedback, getAISessionSummary, reps, formScore, endSession, selectedCoaches]);

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col animate-fade-in">
      <Header coachModel={coachModel} onCoachModelChange={handleCoachModelChange} onSettingsClick={() => setIsMobileSettingsOpen(true)} />
      <main className="flex-grow container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          {/* Left Panel: Video and Controls */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <VideoFeed
              exercise={selectedExercise}
              onRepCount={setReps}
              onFormFeedback={setFormFeedback}
              isDebugMode={isDebugMode}
              onPoseData={setPoseData}
              onFormScoreUpdate={setFormScore}
              onNewRepData={handleNewRepData}
              coachPersonality={coachPersonality}
              isRecordingEnabled={isRecordingEnabled}
              workoutMode={workoutMode}
              isWorkoutActive={isWorkoutActive}
              timeLeft={timeLeft}
              onSessionEnd={endSession}
              onSessionReset={resetSession}
            />
            {/* Mobile-only coach feedback */}
            <div className="lg:hidden">
                <CoachFeedback reps={reps} formFeedback={formFeedback} formScore={formScore} coachModel={coachModel} workoutMode={workoutMode} />
            </div>
            
            <DesktopControls
              workoutMode={workoutMode}
              onWorkoutModeChange={handleWorkoutModeChange}
              selectedExercise={selectedExercise}
              onExerciseChange={handleExerciseChange}
              coachPersonality={coachPersonality}
              onCoachPersonalityChange={setCoachPersonality}
              isHighContrast={isHighContrast}
              onHighContrastChange={setIsHighContrast}
              isAudioFeedbackEnabled={isAudioFeedbackEnabled}
              onAudioFeedbackChange={setIsAudioFeedbackEnabled}
              isRecordingEnabled={isRecordingEnabled}
              onRecordingChange={setIsRecordingEnabled}
              isDebugMode={isDebugMode}
              onDebugChange={setIsDebugMode}
            />
          </div>

          {/* Right Panel: Coach Feedback & Stats */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Desktop-only coach feedback */}
            <div className="hidden lg:block">
              <CoachFeedback reps={reps} formFeedback={formFeedback} formScore={formScore} coachModel={coachModel} workoutMode={workoutMode} />
            </div>
            
            <div ref={analyticsRef}>
              <Collapsible open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <AnalyticsIcon className="mr-2 h-4 w-4" />
                    Show Performance &amp; Achievements
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-4 animate-fade-in">
                  <div className="bg-card p-4 rounded-lg border">
                    <CoachSummarySelector 
                      selectedCoaches={selectedCoaches}
                      onSelectionChange={setSelectedCoaches}
                      disabled={isWorkoutActive || isSummaryLoading}
                    />
                  </div>
                  <PerformanceAnalytics
                    repHistory={repHistory}
                    totalReps={reps}
                    averageFormScore={formScore}
                    exercise={selectedExercise}
                    sessionDuration={sessionDuration}
                    repTimings={repTimings}
                    sessionSummaries={sessionSummaries}
                    isSummaryLoading={isSummaryLoading}
                  />
                  <UnlockedAchievements achievements={achievements} />
                </CollapsibleContent>
              </Collapsible>
            </div>
            
            {isDebugMode && <DebugPanel poseData={poseData} />}
          </div>
        </div>
      </main>
      <div className="lg:hidden">
        <Button
          size="icon"
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 animate-fade-in"
          onClick={() => setIsMobileSettingsOpen(true)}
        >
          <Settings className="h-6 w-6" />
        </Button>
        <MobileControls
          open={isMobileSettingsOpen}
          onOpenChange={setIsMobileSettingsOpen}
          workoutMode={workoutMode}
          onModeChange={handleWorkoutModeChange}
          selectedExercise={selectedExercise}
          onExerciseChange={handleExerciseChange}
          selectedPersonality={coachPersonality}
          onPersonalityChange={setCoachPersonality}
          isRecordingEnabled={isRecordingEnabled}
          onRecordingChange={setIsRecordingEnabled}
          isDebugMode={isDebugMode}
          onDebugChange={setIsDebugMode}
          isAudioFeedbackEnabled={isAudioFeedbackEnabled}
          onAudioFeedbackChange={setIsAudioFeedbackEnabled}
          isHighContrast={isHighContrast}
          onHighContrastChange={setIsHighContrast}
        />
      </div>
    </div>
  );
};

export default Index;
