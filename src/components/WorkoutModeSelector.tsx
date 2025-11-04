
import { AnimatedButton } from "@/components/ui/animated-button";
import { WorkoutMode } from "@/lib/types";
import { Dumbbell, ClipboardCheck } from "lucide-react";

interface WorkoutModeSelectorProps {
  selectedMode: WorkoutMode;
  onModeChange: (mode: WorkoutMode) => void;
}

const modes: { id: WorkoutMode; name: string; icon: React.ElementType }[] = [
  { id: "training", name: "Training", icon: Dumbbell },
  { id: "assessment", name: "Assessment", icon: ClipboardCheck },
];

const WorkoutModeSelector = ({ selectedMode, onModeChange }: WorkoutModeSelectorProps) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Mode</h4>
      <div className="flex items-center gap-1 rounded-lg bg-background p-1 border">
        {modes.map((mode) => (
          <AnimatedButton
            key={mode.id}
            variant={selectedMode === mode.id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onModeChange(mode.id)}
            className="flex-1 justify-center gap-1 text-xs"
            animationPreset="scale"
          >
            <mode.icon className="h-3 w-3" />
            {mode.name}
          </AnimatedButton>
        ))}
      </div>
    </div>
  );
};

export default WorkoutModeSelector;
