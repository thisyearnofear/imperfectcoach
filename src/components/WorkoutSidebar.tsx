import CoreControls from "@/components/CoreControls";
import CoachFeedback from "@/components/CoachFeedback";
import MyPassport from "@/components/MyPassport"; // Import the new component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Exercise,
  CoachPersonality,
  WorkoutMode,
  CoachModel,
} from "@/lib/types";

interface WorkoutSidebarProps {
  // Core Controls props
  workoutMode: WorkoutMode;
  onWorkoutModeChange: (mode: WorkoutMode) => void;
  selectedExercise: Exercise;
  onExerciseChange: (exercise: Exercise) => void;
  coachPersonality: CoachPersonality;
  onCoachPersonalityChange: (personality: CoachPersonality) => void;

  // Coach Model props
  coachModel: CoachModel;
  onCoachModelChange: (model: CoachModel) => void;

  // Live Feedback props
  reps: number;
  formScore: number;
  formFeedback: string;
}

const WorkoutSidebar = (props: WorkoutSidebarProps) => {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Workout Controls */}
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

          {/* Coach Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Coach Model</label>
            <Select
              value={props.coachModel}
              onValueChange={props.onCoachModelChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* On-Chain Passport */}
      <MyPassport />

      {/* Live Feedback - Always visible during workout */}
      <div className="bg-card p-4 rounded-lg border flex-1">
        <h3 className="text-lg font-semibold mb-4">Live Feedback</h3>
        <CoachFeedback
          reps={props.reps}
          formFeedback={props.formFeedback}
          formScore={props.formScore}
          coachModel={props.coachModel}
          workoutMode={props.workoutMode}
        />
      </div>
    </div>
  );
};

export default WorkoutSidebar;
