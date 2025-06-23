import VideoFeed from "@/components/VideoFeed";
import WorkoutSidebar from "@/components/WorkoutSidebar";
import CoachFeedback from "@/components/CoachFeedback";
import CoreControls from "@/components/CoreControls";
import Leaderboard from "@/components/Leaderboard";
import PoseDetectionGuide from "@/components/PoseDetectionGuide";
import {
  Exercise,
  CoachPersonality,
  WorkoutMode,
  PoseData,
  RepData,
  CoachModel,
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

  // WorkoutSidebar props
  onWorkoutModeChange: (mode: WorkoutMode) => void;
  onExerciseChange: (exercise: Exercise) => void;
  onCoachPersonalityChange: (personality: CoachPersonality) => void;
  coachModel: CoachModel;
  onCoachModelChange: (model: CoachModel) => void;
  reps: number;
  formScore: number;
  formFeedback: string;
}

export const TopSection = (props: TopSectionProps) => {
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
          />

          {/* Desktop Leaderboard - Below video, same width */}
          <div className="hidden lg:block">
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
            workoutMode={props.workoutMode}
            onWorkoutModeChange={props.onWorkoutModeChange}
            selectedExercise={props.exercise}
            onExerciseChange={props.onExerciseChange}
            coachPersonality={props.coachPersonality}
            onCoachPersonalityChange={props.onCoachPersonalityChange}
            coachModel={props.coachModel}
            onCoachModelChange={props.onCoachModelChange}
            reps={props.reps}
            formScore={props.formScore}
            formFeedback={props.formFeedback}
          />
        </div>
      </div>

      {/* Mobile: Stacked layout with feedback first, then controls below video */}
      <div className="lg:hidden mt-6 space-y-4">
        {/* Mobile Visual Guide - First on mobile for educational value */}
        <PoseDetectionGuide />
        {/* Live Feedback - Now first on mobile too for consistency */}
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Live Feedback</h3>
          <CoachFeedback
            reps={props.reps}
            formFeedback={props.formFeedback}
            formScore={props.formScore}
            coachModel={props.coachModel}
            workoutMode={props.workoutMode}
          />
        </div>

        {/* Workout Setup - Now second */}
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Workout Setup</h3>
          <CoreControls
            workoutMode={props.workoutMode}
            onWorkoutModeChange={props.onWorkoutModeChange}
            selectedExercise={props.exercise}
            onExerciseChange={props.onExerciseChange}
            coachPersonality={props.coachPersonality}
            onCoachPersonalityChange={props.onCoachPersonalityChange}
          />
        </div>

        {/* Mobile Leaderboard - At bottom */}
        <Leaderboard timeframe="week" />
      </div>
    </div>
  );
};
