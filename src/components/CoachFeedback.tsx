import { CoachModel, WorkoutMode } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

interface CoachFeedbackProps {
  reps: number;
  formFeedback: string;
  formScore: number;
  coachModel: CoachModel;
  workoutMode: WorkoutMode;
  onPremiumUpgrade?: () => void;
}

const CoachFeedback = ({
  reps,
  formFeedback,
  formScore,
  coachModel,
  workoutMode,
  onPremiumUpgrade,
}: CoachFeedbackProps) => {
  const getScoreColor = () => {
    if (formScore >= 80) return "text-green-500";
    if (formScore >= 60) return "text-yellow-500";
    return "text-destructive";
  };

  const getProgressColor = () => {
    if (formScore >= 80) return "bg-green-500";
    if (formScore >= 60) return "bg-yellow-500";
    return "bg-destructive";
  };

  const coachName = coachModel.charAt(0).toUpperCase() + coachModel.slice(1);

  const getTitle = () => {
    if (workoutMode === "assessment") {
      return "Assessment Mode";
    }
    return `Coach ${coachName} says...`;
  };

  const getFeedbackStyle = () => {
    const feedbackLower = formFeedback.toLowerCase();

    // Positive/ready states: bigger and green
    if (
      feedbackLower.includes("ready") ||
      feedbackLower.includes("start position") ||
      feedbackLower.includes("great") ||
      feedbackLower.includes("nice")
    ) {
      return "text-green-500 text-xl font-semibold";
    }

    // Error/critical states: red
    if (
      feedbackLower.includes("can't see you") ||
      feedbackLower.includes("trouble seeing") ||
      feedbackLower.includes("denied") ||
      feedbackLower.includes("poor form")
    ) {
      return "text-destructive text-lg font-semibold";
    }

    // Corrective/warning states: yellow
    if (
      feedbackLower.includes("hang from") ||
      feedbackLower.includes("pull evenly") ||
      feedbackLower.includes("higher") ||
      feedbackLower.includes("full extension") ||
      feedbackLower.includes("chin over") ||
      feedbackLower.includes("make sure") ||
      feedbackLower.includes("evenly")
    ) {
      return "text-yellow-500 text-lg font-medium";
    }

    // Default/neutral
    return "text-muted-foreground text-lg";
  };

  return (
    <div className="bg-card p-4 rounded-lg border border-border/40 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-3 text-primary">{getTitle()}</h3>
      <div className="flex-grow flex items-center justify-center p-2 min-h-[60px]">
        <p
          className={`text-center transition-all duration-300 ${getFeedbackStyle()}`}
        >
          {formFeedback}
        </p>
      </div>

      {/* Premium Upsell Hint */}
      {formFeedback.includes("Upgrade for") && (
        <div className="mt-3 p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2">
            <span className="text-amber-600">✨</span>
            <button
              onClick={onPremiumUpgrade}
              className="text-sm text-amber-700 hover:text-amber-800 font-medium underline"
            >
              Get detailed AI analysis for $0.05
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <div className="flex justify-between items-baseline">
          <h4 className="font-semibold">
            Reps:{" "}
            <span className="text-primary font-bold text-2xl ml-2">{reps}</span>
          </h4>
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <h4 className="font-semibold">Form Score:</h4>
            <span className={`font-bold text-2xl ${getScoreColor()}`}>
              {formScore.toFixed(0)}
            </span>
          </div>
          <Progress
            value={formScore}
            className="h-3"
            indicatorClassName={getProgressColor()}
          />
        </div>
      </div>
    </div>
  );
};

export default CoachFeedback;
