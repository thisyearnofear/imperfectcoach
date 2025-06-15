
import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import WorkoutModeSelector from "./WorkoutModeSelector";
import ExerciseSelector from "./ExerciseSelector";
import CoachPersonalitySelector from "./CoachPersonalitySelector";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Exercise, CoachPersonality, WorkoutMode } from "@/lib/types";

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
}: MobileControlsProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 animate-fade-in"
        >
          <Settings className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-lg">
        <SheetHeader>
          <SheetTitle>Workout Settings</SheetTitle>
        </SheetHeader>
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
            <Button>Done</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileControls;
