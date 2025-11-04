import { useState, forwardRef, useImperativeHandle, useRef } from "react";
import VideoFeed from "@/components/VideoFeed";
import WorkoutSidebar from "@/components/WorkoutSidebar";
import CoachFeedback from "@/components/CoachFeedback";
import CoreControls from "@/components/CoreControls";
import Leaderboard from "@/components/Leaderboard";
import PoseDetectionGuide from "@/components/PoseDetectionGuide";
import { ContextualSuggestion } from "@/components/ContextualSuggestion";
import {
  Exercise,
  CoachPersonality,
  WorkoutMode,
  PoseData,
  RepData,
  HeightUnit,
} from "@/lib/types";

interface TopSectionProps {
  // VideoFeed props
  exercise: Exercise;
  onRepCount: (update: (prev: number) => number) => void;
  onFormFeedback: (message: string) => void;
  isDebugMode: boolean;
  onPoseData: (data: PoseData | null) => void;
  onFormScoreUpdate: (score: number) => void;
  onNewRepData: (data: RepData) => void;
  coachPersonality: CoachPersonality;
  isRecordingEnabled: boolean;
  workoutMode: WorkoutMode;
  isWorkoutActive: boolean;
  timeLeft: number;
  onSessionEnd: () => void;
  onSessionReset: () => void;
  heightUnit: HeightUnit;
  isFocusMode?: boolean;

  // WorkoutSidebar props
  onWorkoutModeChange: (mode: WorkoutMode) => void;
  onExerciseChange: (exercise: Exercise) => void;
  onCoachPersonalityChange: (personality: CoachPersonality) => void;
  onFocusModeChange?: (enabled: boolean) => void;
  reps: number;
  formScore: number;
  formFeedback: string;
}

export const TopSection = forwardRef<
  { triggerFocusExplanation: () => void },
  TopSectionProps
>((props, ref) => {
  const [showModeExplanation, setShowModeExplanation] = useState(false);
  const [showFocusExplanation, setShowFocusExplanation] = useState(false);
  const workoutSidebarRef = useRef<{ triggerFocusExplanation: () => void }>(null);

  const handleModeChange = (mode: WorkoutMode) => {
    props.onWorkoutModeChange(mode);
    // Show explanation when mode changes
    setShowModeExplanation(true);
  };

  const handleFocusModeChange = (enabled: boolean) => {
    props.onFocusModeChange?.(enabled);
    // Show explanation when focus mode changes
    setShowFocusExplanation(true);
  };

  // Expose method to trigger focus explanation from parent
  useImperativeHandle(ref, () => ({
    triggerFocusExplanation: () => {
      // Trigger focus explanation in WorkoutSidebar (desktop)
      workoutSidebarRef.current?.triggerFocusExplanation();
      // Also trigger for mobile version
      setShowFocusExplanation(true);
    }
  }));

  return (
    <div className="w-full">
      {/* Desktop: Side-by-side layout, Mobile: Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: VideoFeed + Leaderboard - Optimal size for quality (~60% width) */}
        <div className="lg:col-span-2 space-y-4">
          <VideoFeed
            exercise={props.exercise}
            onRepCount={props.onRepCount}
            onFormFeedback={props.onFormFeedback}
            isDebugMode={props.isDebugMode}
            onPoseData={props.onPoseData}
            onFormScoreUpdate={props.onFormScoreUpdate}
            onNewRepData={props.onNewRepData}
            coachPersonality={props.coachPersonality}
            isRecordingEnabled={props.isRecordingEnabled}
            workoutMode={props.workoutMode}
            isWorkoutActive={props.isWorkoutActive}
            timeLeft={props.timeLeft}
            onSessionEnd={props.onSessionEnd}
            onSessionReset={props.onSessionReset}
            heightUnit={props.heightUnit}
            reps={props.reps}
            formScore={props.formScore}
            isFocusMode={props.isFocusMode}
          />

          {/* Contextual Suggestions - Appear during workout based on performance */}
          <div className="lg:hidden">
            <ContextualSuggestion
              context={{
                exercise: props.exercise,
                formScore: props.formScore,
                sessionCount: props.reps
              }}
              variant="compact"
              autoDismiss={true}
            />
          </div>

          {/* Desktop Leaderboard - Below video, same width */}
          <div className="hidden lg:block">
            <div className="mb-4">
              <ContextualSuggestion
                context={{
                  exercise: props.exercise,
                  formScore: props.formScore,
                  sessionCount: props.reps
                }}
                variant="banner"
                autoDismiss={true}
              />
            </div>
            <Leaderboard timeframe="week" />
          </div>

          {/* Desktop Visual Guide - Below leaderboard for landscape symmetry */}
          <div className="hidden lg:block">
            <PoseDetectionGuide />
          </div>
        </div>

        {/* Right: Workout Sidebar - Controls + Live Feedback (~40% width) */}
        <div className="lg:col-span-1 hidden lg:block">
          <WorkoutSidebar
            ref={workoutSidebarRef}
            workoutMode={props.workoutMode}
            onWorkoutModeChange={props.onWorkoutModeChange}
            selectedExercise={props.exercise}
            onExerciseChange={props.onExerciseChange}
            coachPersonality={props.coachPersonality}
            onCoachPersonalityChange={props.onCoachPersonalityChange}
            reps={props.reps}
            formScore={props.formScore}
            formFeedback={props.formFeedback}
            isFocusMode={props.isFocusMode}
            onFocusModeChange={handleFocusModeChange}
          />
        </div>
      </div>

      {/* Mobile: Stacked layout with setup first, then feedback */}
      <div className="lg:hidden mt-6 space-y-4">
        {/* Workout Setup - First so users configure before starting */}
        <div className="bg-card p-3 rounded-lg border">
          <h3 className="text-base font-semibold mb-3">Workout Setup</h3>
          <CoreControls
            workoutMode={props.workoutMode}
            onWorkoutModeChange={handleModeChange}
            selectedExercise={props.exercise}
            onExerciseChange={props.onExerciseChange}
            coachPersonality={props.coachPersonality}
            onCoachPersonalityChange={props.onCoachPersonalityChange}
          />
        </div>

        {/* Live Feedback - Below setup for workout feedback */}
        <CoachFeedback
          reps={props.reps}
          formFeedback={props.formFeedback}
          formScore={props.formScore}
          coachPersonality={props.coachPersonality}
          workoutMode={props.workoutMode}
          variant="compact"
          showModeExplanation={showModeExplanation}
          onModeExplanationShown={() => setShowModeExplanation(false)}
          showFocusExplanation={showFocusExplanation}
          onFocusExplanationShown={() => setShowFocusExplanation(false)}
          isFocusMode={props.isFocusMode}
        />

        {/* Mobile Visual Guide - After feedback for reference */}
        <PoseDetectionGuide />

        {/* Mobile Leaderboard - At bottom */}
        <Leaderboard timeframe="week" />
      </div>
    </div>
  );
});
