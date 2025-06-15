
import { Button } from "@/components/ui/button";
import { useState } from "react";

type Exercise = "pull-ups" | "jumps" | "squats";

const exercises: Exercise[] = ["pull-ups", "jumps", "squats"];

const ExerciseSelector = () => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise>("pull-ups");

  return (
    <div className="bg-card p-4 rounded-lg border border-border/40 mt-4">
      <h3 className="text-lg font-semibold mb-3 text-center">Select Your Exercise</h3>
      <div className="grid grid-cols-3 gap-2">
        {exercises.map((exercise) => (
          <Button
            key={exercise}
            variant={selectedExercise === exercise ? "default" : "secondary"}
            onClick={() => setSelectedExercise(exercise)}
            className="capitalize"
          >
            {exercise}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ExerciseSelector;
