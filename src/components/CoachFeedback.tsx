
import { CoachModel } from "@/lib/types";

interface CoachFeedbackProps {
  reps: number;
  formFeedback: string;
  formScore: number;
  coachModel: CoachModel;
}

const CoachFeedback = ({ reps, formFeedback, formScore, coachModel }: CoachFeedbackProps) => {
  const getScoreColor = () => {
    if (formScore >= 80) return 'text-green-500';
    if (formScore >= 60) return 'text-yellow-500';
    return 'text-destructive';
  }

  const coachName = coachModel.charAt(0).toUpperCase() + coachModel.slice(1);

  return (
    <div className="bg-card p-4 rounded-lg border border-border/40 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-3 text-primary">Coach {coachName} says...</h3>
      <div className="flex-grow flex items-center justify-center">
        <p className="text-muted-foreground italic text-center">
          {formFeedback}
        </p>
      </div>
      <div className="mt-4">
        <h4 className="font-semibold">Reps: <span className="text-primary font-bold text-2xl ml-2">{reps}</span></h4>
        <h4 className="font-semibold mt-2">Form Score: <span className={`font-bold text-2xl ml-2 ${getScoreColor()}`}>{formScore.toFixed(0)}</span></h4>
      </div>
    </div>
  );
};

export default CoachFeedback;
