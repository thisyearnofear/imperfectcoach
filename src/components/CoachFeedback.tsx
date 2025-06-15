
import { CoachModel, WorkoutMode } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

interface CoachFeedbackProps {
  reps: number;
  formFeedback: string;
  formScore: number;
  coachModel: CoachModel;
  workoutMode: WorkoutMode;
}

const CoachFeedback = ({ reps, formFeedback, formScore, coachModel, workoutMode }: CoachFeedbackProps) => {
  const getScoreColor = () => {
    if (formScore >= 80) return 'text-green-500';
    if (formScore >= 60) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getProgressColor = () => {
    if (formScore >= 80) return 'bg-green-500';
    if (formScore >= 60) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  const coachName = coachModel.charAt(0).toUpperCase() + coachModel.slice(1);

  const getTitle = () => {
    if (workoutMode === 'assessment') {
      return "Assessment Mode";
    }
    return `Coach ${coachName} says...`;
  };

  return (
    <div className="bg-card p-4 rounded-lg border border-border/40 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-3 text-primary">{getTitle()}</h3>
      <div className="flex-grow flex items-center justify-center">
        <p className="text-muted-foreground italic text-center">
          {workoutMode === 'training' 
            ? formFeedback 
            : "Your form is being analyzed. Focus on your movements."}
        </p>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex justify-between items-baseline">
          <h4 className="font-semibold">Reps: <span className="text-primary font-bold text-2xl ml-2">{reps}</span></h4>
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-semibold">Form Score:</h4>
            <span className={`font-bold text-2xl ${getScoreColor()}`}>{formScore.toFixed(0)}</span>
          </div>
          <Progress value={formScore} className="h-3" indicatorClassName={getProgressColor()} />
        </div>
      </div>
    </div>
  );
};

export default CoachFeedback;
