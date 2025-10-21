
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
    <div className="bg-card p-4 rounded-lg border border-border/40">
      <h3 className="text-lg font-semibold mb-3 text-center">Select Your Exercise</h3>
      <div className="grid grid-cols-2 gap-4">
        {exercises.map((exercise) => (
          <AnimatedButton
            key={exercise}
            variant={selectedExercise === exercise ? "default" : "secondary"}
            onClick={() => onExerciseChange(exercise)}
            className="capitalize"
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
