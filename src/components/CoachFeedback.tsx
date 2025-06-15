
const CoachFeedback = () => {
  return (
    <div className="bg-card p-4 rounded-lg border border-border/40 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-3 text-primary">Coach Gemini says...</h3>
      <div className="flex-grow flex items-center justify-center">
        <p className="text-muted-foreground italic text-center">
          Enable your camera and select an exercise to begin. Let's see what you've got!
        </p>
      </div>
      <div className="mt-4">
        <h4 className="font-semibold">Reps: <span className="text-primary font-bold text-2xl ml-2">0</span></h4>
        <h4 className="font-semibold mt-2">Form: <span className="text-primary font-bold text-lg ml-2">-</span></h4>
      </div>
    </div>
  );
};

export default CoachFeedback;
