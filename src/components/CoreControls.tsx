import ExerciseSelector from "@/components/ExerciseSelector";
import WorkoutModeSelector from "@/components/WorkoutModeSelector";
import CoachPersonalitySelector from "@/components/CoachPersonalitySelector";
import { Exercise, CoachPersonality, WorkoutMode } from "@/lib/types";

interface CoreControlsProps {
    workoutMode: WorkoutMode;
    onWorkoutModeChange: (mode: WorkoutMode) => void;
    selectedExercise: Exercise;
    onExerciseChange: (exercise: Exercise) => void;
    coachPersonality: CoachPersonality;
    onCoachPersonalityChange: (personality: CoachPersonality) => void;
}

const CoreControls = ({
    workoutMode,
    onWorkoutModeChange,
    selectedExercise,
    onExerciseChange,
    coachPersonality,
    onCoachPersonalityChange,
}: CoreControlsProps) => {
    return (
        <div className="w-full">
            {/* Core workout controls - stacked vertically for sidebar or horizontal for mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-3 gap-4">
                <ExerciseSelector
                    selectedExercise={selectedExercise}
                    onExerciseChange={onExerciseChange}
                />
                <WorkoutModeSelector
                    selectedMode={workoutMode}
                    onModeChange={onWorkoutModeChange}
                />
                <CoachPersonalitySelector
                    selectedPersonality={coachPersonality}
                    onPersonalityChange={onCoachPersonalityChange}
                />
            </div>
        </div>
    );
};

export default CoreControls;
