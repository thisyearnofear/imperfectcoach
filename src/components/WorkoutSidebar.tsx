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
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Live Feedback - Moved to top so users can see feedback while positioning */}
      <div className="bg-card p-4 rounded-lg border flex-1">
        <h3 className="text-lg font-semibold mb-4">Live Feedback</h3>
        <CoachFeedback
          reps={props.reps}
          formFeedback={props.formFeedback}
          formScore={props.formScore}
          coachPersonality={props.coachPersonality}
          workoutMode={props.workoutMode}
        />
      </div>

      {/* Passport - both desktop and mobile */}
      <MyPassport />

      {/* Workout Controls - Moved below feedback */}
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Workout Setup</h3>
        <div className="space-y-4">
          <CoreControls
            workoutMode={props.workoutMode}
            onWorkoutModeChange={props.onWorkoutModeChange}
            selectedExercise={props.selectedExercise}
            onExerciseChange={props.onExerciseChange}
            coachPersonality={props.coachPersonality}
            onCoachPersonalityChange={props.onCoachPersonalityChange}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkoutSidebar;
