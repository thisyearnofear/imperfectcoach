
import { AnimatedButton } from "@/components/ui/animated-button";
import { Exercise } from "@/lib/types";

const exercises: Exercise[] = [
  "pull-ups",
  "jumps"
];

interface ExerciseSelectorProps {
  selectedExercise: Exercise;
  onExerciseChange: (exercise: Exercise) => void;
}

const ExerciseSelector = ({ selectedExercise, onExerciseChange }: ExerciseSelectorProps) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Exercise</h4>
      <div className="grid grid-cols-2 gap-2">
        {exercises.map((exercise) => (
          <AnimatedButton
            key={exercise}
            variant={selectedExercise === exercise ? "default" : "secondary"}
            onClick={() => onExerciseChange(exercise)}
            className="capitalize"
            size="sm"
            animationPreset="scale"
          >
            {exercise}
          </AnimatedButton>
        ))}
      </div>
    </div>
  );
};

export default ExerciseSelector;
