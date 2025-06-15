
import { Button } from "@/components/ui/button";
import { Exercise } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const exercises: { name: Exercise; enabled: boolean }[] = [
  { name: "pull-ups", enabled: true },
  { name: "jumps", enabled: false },
  { name: "squats", enabled: false },
];

interface ExerciseSelectorProps {
  selectedExercise: Exercise;
  onExerciseChange: (exercise: Exercise) => void;
}

const ExerciseSelector = ({ selectedExercise, onExerciseChange }: ExerciseSelectorProps) => {
  return (
    <div className="bg-card p-4 rounded-lg border border-border/40">
      <h3 className="text-lg font-semibold mb-3 text-center">Select Your Exercise</h3>
      <TooltipProvider>
        <div className="grid grid-cols-3 gap-2">
          {exercises.map((exercise) =>
            exercise.enabled ? (
              <Button
                key={exercise.name}
                variant={selectedExercise === exercise.name ? "default" : "secondary"}
                onClick={() => onExerciseChange(exercise.name)}
                className="capitalize"
              >
                {exercise.name}
              </Button>
            ) : (
              <Tooltip key={exercise.name}>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    disabled
                    className="capitalize w-full cursor-not-allowed"
                  >
                    {exercise.name}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming Soon!</p>
                </TooltipContent>
              </Tooltip>
            )
          )}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default ExerciseSelector;
