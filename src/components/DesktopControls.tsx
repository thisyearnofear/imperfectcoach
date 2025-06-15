
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";
import ExerciseSelector from "@/components/ExerciseSelector";
import WorkoutModeSelector from "@/components/WorkoutModeSelector";
import CoachPersonalitySelector from "@/components/CoachPersonalitySelector";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Exercise, CoachPersonality, WorkoutMode } from "@/lib/types";

interface DesktopControlsProps {
    workoutMode: WorkoutMode;
    onWorkoutModeChange: (mode: WorkoutMode) => void;
    selectedExercise: Exercise;
    onExerciseChange: (exercise: Exercise) => void;
    coachPersonality: CoachPersonality;
    onCoachPersonalityChange: (personality: CoachPersonality) => void;
    isHighContrast: boolean;
    onHighContrastChange: (enabled: boolean) => void;
    isAudioFeedbackEnabled: boolean;
    onAudioFeedbackChange: (enabled: boolean) => void;
    isRecordingEnabled: boolean;
    onRecordingChange: (enabled: boolean) => void;
    isDebugMode: boolean;
    onDebugChange: (enabled: boolean) => void;
}

const DesktopControls = ({
    workoutMode,
    onWorkoutModeChange,
    selectedExercise,
    onExerciseChange,
    coachPersonality,
    onCoachPersonalityChange,
    isHighContrast,
    onHighContrastChange,
    isAudioFeedbackEnabled,
    onAudioFeedbackChange,
    isRecordingEnabled,
    onRecordingChange,
    isDebugMode,
    onDebugChange,
}: DesktopControlsProps) => {
    return (
        <div className="hidden lg:flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <WorkoutModeSelector
                    selectedMode={workoutMode}
                    onModeChange={onWorkoutModeChange}
                />
                <ExerciseSelector
                    selectedExercise={selectedExercise}
                    onExerciseChange={onExerciseChange}
                />
            </div>
            <div className="flex justify-between items-center flex-wrap gap-4 mt-2">
                <CoachPersonalitySelector
                    selectedPersonality={coachPersonality}
                    onPersonalityChange={onCoachPersonalityChange}
                />
                <div className="flex items-center gap-4 mt-2 sm:mt-0 flex-wrap">
                    <ThemeToggle />
                    <div className="flex items-center space-x-2">
                        <Switch id="enable-high-contrast" checked={isHighContrast} onCheckedChange={onHighContrastChange} />
                        <Label htmlFor="enable-high-contrast">High Contrast</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="enable-audio" checked={isAudioFeedbackEnabled} onCheckedChange={onAudioFeedbackChange} />
                        <Label htmlFor="enable-audio">Audio Feedback</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="enable-recording" checked={isRecordingEnabled} onCheckedChange={onRecordingChange} />
                        <Label htmlFor="enable-recording">Enable Recording</Label>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDebugChange(!isDebugMode)}
                    >
                        <Bug className="mr-2 h-4 w-4" />
                        {isDebugMode ? "Hide" : "Show"} Debug
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DesktopControls;
