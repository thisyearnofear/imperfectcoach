
import { Button } from "@/components/ui/button";
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
    <div className="flex items-center gap-2 rounded-lg bg-background p-1 border">
      {modes.map((mode) => (
        <Button
          key={mode.id}
          variant={selectedMode === mode.id ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onModeChange(mode.id)}
          className="flex-1 justify-center gap-2"
        >
          <mode.icon className="h-4 w-4" />
          {mode.name}
        </Button>
      ))}
    </div>
  );
};

export default WorkoutModeSelector;
