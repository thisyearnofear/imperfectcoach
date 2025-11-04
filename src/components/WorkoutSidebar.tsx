import { useState } from "react";
import CoreControls from "@/components/CoreControls";
import CoachFeedback from "@/components/CoachFeedback";
import MyPassport from "@/components/MyPassport";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Exercise, CoachPersonality, WorkoutMode } from "@/lib/types";

interface WorkoutSidebarProps {
  // Core Controls props
  workoutMode: WorkoutMode;
  onWorkoutModeChange: (mode: WorkoutMode) => void;
  selectedExercise: Exercise;
  onExerciseChange: (exercise: Exercise) => void;
  coachPersonality: CoachPersonality;
  onCoachPersonalityChange: (personality: CoachPersonality) => void;

  // Live Feedback props
  reps: number;
  formScore: number;
  formFeedback: string;
}

const WorkoutSidebar = (props: WorkoutSidebarProps) => {
  const [showModeExplanation, setShowModeExplanation] = useState(false);

  const handleModeChange = (mode: WorkoutMode) => {
    props.onWorkoutModeChange(mode);
    // Show explanation when mode changes
    setShowModeExplanation(true);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Workout Setup - Moved to top so users configure before starting */}
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Workout Setup</h3>
        <div className="space-y-4">
          <CoreControls
            workoutMode={props.workoutMode}
            onWorkoutModeChange={handleModeChange}
            selectedExercise={props.selectedExercise}
            onExerciseChange={props.onExerciseChange}
            coachPersonality={props.coachPersonality}
            onCoachPersonalityChange={props.onCoachPersonalityChange}
          />
        </div>
      </div>

      {/* Live Feedback - Below setup so users see feedback during workout */}
      <div className="flex-1">
        <CoachFeedback
          reps={props.reps}
          formFeedback={props.formFeedback}
          formScore={props.formScore}
          coachPersonality={props.coachPersonality}
          workoutMode={props.workoutMode}
          showModeExplanation={showModeExplanation}
          onModeExplanationShown={() => setShowModeExplanation(false)}
        />
      </div>

      {/* Passport - at bottom */}
      <MyPassport />
    </div>
  );
};

export default WorkoutSidebar;
