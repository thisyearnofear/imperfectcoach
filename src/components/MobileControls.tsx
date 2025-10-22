import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { AnimatedButton } from "@/components/ui/animated-button";
import WorkoutModeSelector from "./WorkoutModeSelector";
import ExerciseSelector from "./ExerciseSelector";
import CoachPersonalitySelector from "./CoachPersonalitySelector";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Exercise, CoachPersonality, WorkoutMode } from "@/lib/types";
import { FeatureSpotlight } from "@/components/FeatureSpotlight";

interface MobileControlsProps {
  workoutMode: WorkoutMode;
  onModeChange: (mode: WorkoutMode) => void;
  selectedExercise: Exercise;
  onExerciseChange: (exercise: Exercise) => void;
  selectedPersonality: CoachPersonality;
  onPersonalityChange: (personality: CoachPersonality) => void;
  isRecordingEnabled: boolean;
  onRecordingChange: (enabled: boolean) => void;
  isDebugMode: boolean;
  onDebugChange: (enabled: boolean) => void;
  isAudioFeedbackEnabled: boolean;
  onAudioFeedbackChange: (enabled: boolean) => void;
  isHighContrast: boolean;
  onHighContrastChange: (enabled: boolean) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileControls = ({
  workoutMode,
  onModeChange,
  selectedExercise,
  onExerciseChange,
  selectedPersonality,
  onPersonalityChange,
  isRecordingEnabled,
  onRecordingChange,
  isDebugMode,
  onDebugChange,
  isAudioFeedbackEnabled,
  onAudioFeedbackChange,
  isHighContrast,
  onHighContrastChange,
  open,
  onOpenChange,
}: MobileControlsProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-lg">
        <SheetHeader>
          <SheetTitle>Workout Settings</SheetTitle>
        </SheetHeader>
        <div className="py-2">
          <FeatureSpotlight variant="compact" />
        </div>
        <div className="grid gap-6 py-6">
          <WorkoutModeSelector
            selectedMode={workoutMode}
            onModeChange={onModeChange}
          />
          <ExerciseSelector
            selectedExercise={selectedExercise}
            onExerciseChange={onExerciseChange}
          />
          <CoachPersonalitySelector
            selectedPersonality={selectedPersonality}
            onPersonalityChange={onPersonalityChange}
          />

          <div className="flex items-center justify-between">
            <Label htmlFor="enable-high-contrast-mobile">
              High Contrast Mode
            </Label>
            <Switch
              id="enable-high-contrast-mobile"
              checked={isHighContrast}
              onCheckedChange={onHighContrastChange}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-audio-mobile">Audio Feedback</Label>
            <Switch
              id="enable-audio-mobile"
              checked={isAudioFeedbackEnabled}
              onCheckedChange={onAudioFeedbackChange}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-recording-mobile">Enable Recording</Label>
            <Switch
              id="enable-recording-mobile"
              checked={isRecordingEnabled}
              onCheckedChange={onRecordingChange}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-debug-mobile">Show Debug</Label>
            <Switch
              id="show-debug-mobile"
              checked={isDebugMode}
              onCheckedChange={onDebugChange}
            />
          </div>
          <SheetClose asChild>
            <AnimatedButton animationPreset="scale">Done</AnimatedButton>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileControls;
