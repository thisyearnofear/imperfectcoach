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
  isFocusMode: boolean;
  onFocusModeChange: (enabled: boolean) => void;
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
  isFocusMode,
  onFocusModeChange,
  open,
  onOpenChange,
}: MobileControlsProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-lg overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-background z-10 py-4">
          <div className="flex justify-between items-center">
            <SheetTitle>Workout Settings</SheetTitle>
            <SheetClose asChild>
              <AnimatedButton animationPreset="scale" size="sm" variant="outline">
                Done
              </AnimatedButton>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="py-2">
          <FeatureSpotlight variant="compact" />
        </div>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Workout Controls</h3>
            <WorkoutModeSelector
              selectedMode={workoutMode}
              onModeChange={onModeChange}
            />
            <ExerciseSelector
              selectedExercise={selectedExercise}
              onExerciseChange={onExerciseChange}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Coach Settings</h3>
            <CoachPersonalitySelector
              selectedPersonality={selectedPersonality}
              onPersonalityChange={onPersonalityChange}
            />
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-semibold">Preferences</h3>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="enable-high-contrast-mobile" className="text-base">
                  High Contrast Mode
                </Label>
                <p className="text-xs text-muted-foreground">Better visibility for bright environments</p>
              </div>
              <Switch
                id="enable-high-contrast-mobile"
                checked={isHighContrast}
                onCheckedChange={onHighContrastChange}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="enable-audio-mobile" className="text-base">
                  Audio Feedback
                </Label>
                <p className="text-xs text-muted-foreground">Hear coaching tips during workout</p>
              </div>
              <Switch
                id="enable-audio-mobile"
                checked={isAudioFeedbackEnabled}
                onCheckedChange={onAudioFeedbackChange}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="enable-recording-mobile" className="text-base">
                  Enable Recording
                </Label>
                <p className="text-xs text-muted-foreground">Save your workout sessions</p>
              </div>
              <Switch
                id="enable-recording-mobile"
                checked={isRecordingEnabled}
                onCheckedChange={onRecordingChange}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="show-debug-mobile" className="text-base">
                  Show Debug
                </Label>
                <p className="text-xs text-muted-foreground">Advanced pose detection data</p>
              </div>
              <Switch
                id="show-debug-mobile"
                checked={isDebugMode}
                onCheckedChange={onDebugChange}
              />
            </div>

            {/* Focus Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="focus-mode-mobile" className="text-base">
                  Focus Mode
                </Label>
                <p className="text-xs text-muted-foreground">Minimize distractions during workout</p>
              </div>
              <Switch
                id="focus-mode-mobile"
                checked={isFocusMode}
                onCheckedChange={onFocusModeChange}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileControls;
