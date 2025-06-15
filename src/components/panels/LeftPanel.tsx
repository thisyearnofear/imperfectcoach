
import VideoFeed from "@/components/VideoFeed";
import DesktopControls from "@/components/DesktopControls";
import CoachFeedback from "@/components/CoachFeedback";
import { Exercise, CoachPersonality, WorkoutMode, PoseData, RepData, CoachModel } from "@/lib/types";

interface LeftPanelProps {
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
    
    // DesktopControls props
    onWorkoutModeChange: (mode: WorkoutMode) => void;
    onExerciseChange: (exercise: Exercise) => void;
    onCoachPersonalityChange: (personality: CoachPersonality) => void;
    isHighContrast: boolean;
    onHighContrastChange: (value: boolean) => void;
    isAudioFeedbackEnabled: boolean;
    onAudioFeedbackChange: (value: boolean) => void;
    onRecordingChange: (value: boolean) => void;
    onDebugChange: (value: boolean) => void;

    // Mobile CoachFeedback props
    reps: number;
    formScore: number;
    formFeedback: string;
    coachModel: CoachModel;
}

export const LeftPanel = (props: LeftPanelProps) => {
    return (
        <div className="lg:col-span-2 flex flex-col gap-4">
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
            />
            <div className="lg:hidden">
                <CoachFeedback 
                    reps={props.reps} 
                    formFeedback={props.formFeedback} 
                    formScore={props.formScore} 
                    coachModel={props.coachModel} 
                    workoutMode={props.workoutMode} 
                />
            </div>
            
            <DesktopControls
                workoutMode={props.workoutMode}
                onWorkoutModeChange={props.onWorkoutModeChange}
                selectedExercise={props.exercise}
                onExerciseChange={props.onExerciseChange}
                coachPersonality={props.coachPersonality}
                onCoachPersonalityChange={props.onCoachPersonalityChange}
                isHighContrast={props.isHighContrast}
                onHighContrastChange={props.onHighContrastChange}
                isAudioFeedbackEnabled={props.isAudioFeedbackEnabled}
                onAudioFeedbackChange={props.onAudioFeedbackChange}
                isRecordingEnabled={props.isRecordingEnabled}
                onRecordingChange={props.onRecordingChange}
                isDebugMode={props.isDebugMode}
                onDebugChange={props.onDebugChange}
            />
        </div>
    );
};
