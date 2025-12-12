import {
  ProcessorResult,
  PoseData,
  RepState,
  WorkoutMode,
  Exercise,
  PullupRepDetails,
  JumpRepDetails,
  RepData,
} from "@/lib/types";

export interface HandleProcessorResultParams {
  result: Omit<ProcessorResult, "feedback"> & { feedback?: string };
  workoutMode: WorkoutMode;
  isDebugMode: boolean;
  onPoseData: (data: PoseData | null) => void;
  repState: React.MutableRefObject<RepState>;
  onFormFeedback: (message: string) => void;
  speak: (phrase: string) => void;
  lastRepIssues: React.MutableRefObject<string[]>;
  formIssuePulse: React.MutableRefObject<boolean>;
  pulseTimeout: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  getAIFeedback: (payload: Record<string, unknown>) => void;
  incrementReps: () => void;
  internalReps: number;
  onFormScoreUpdate: (score: number) => void;
  repScores: React.MutableRefObject<number[]>;
  onNewRepData: (data: RepData) => void;
  currentRepAngles: React.MutableRefObject<{ left: number[]; right: number[] }>;
  exercise: Exercise;
  peakAirborneY: React.MutableRefObject<number | null>;
  // ENHANCEMENT: Streak tracking
  updateFormStreak?: (score: number) => void;
}

export function handleProcessorResult(params: HandleProcessorResultParams) {
  const {
    result,
    workoutMode,
    isDebugMode,
    onPoseData,
    repState,
    onFormFeedback,
    speak,
    lastRepIssues,
    formIssuePulse,
    pulseTimeout,
    getAIFeedback,
    incrementReps,
    internalReps,
    onFormScoreUpdate,
    repScores,
    onNewRepData,
    currentRepAngles,
    exercise,
    peakAirborneY,
  } = params;

  if (isDebugMode) onPoseData(result.poseData);
  if (result.newRepState) repState.current = result.newRepState;
  if (result.feedback && workoutMode === "training")
    onFormFeedback(result.feedback);

  if (
    result.formCheckSpeak &&
    workoutMode === "training" &&
    !lastRepIssues.current.includes(result.formCheckSpeak.issue)
  ) {
    speak(result.formCheckSpeak.phrase);
    formIssuePulse.current = true;
    if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
    pulseTimeout.current = setTimeout(() => {
      formIssuePulse.current = false;
    }, 500);
  }

  // Only call AI feedback once per rep to prevent duplicate API calls
  // This happens after rep completion with full context
  if (result.isRepCompleted && result.repCompletionData) {
    incrementReps();
    const { score, issues, details: resultDetails } = result.repCompletionData;
    lastRepIssues.current = [...new Set(issues)];
    repScores.current.push(score);
    // ENHANCEMENT: Update streak on rep completion
    updateFormStreak?.(score);
    if (repScores.current.length > 5) repScores.current.shift();
    const avgScore =
      repScores.current.length > 0
        ? repScores.current.reduce((a, b) => a + b, 0) /
          repScores.current.length
        : 100;
    onFormScoreUpdate(avgScore);

    let details: PullupRepDetails | JumpRepDetails | undefined = resultDetails;
    if (exercise === "pull-ups") {
      const { left, right } = currentRepAngles.current;
      if (left.length > 0 && right.length > 0) {
        const peakElbowFlexion = Math.min(...left, ...right);
        const bottomElbowExtension = Math.max(
          result.poseData.leftElbowAngle!,
          result.poseData.rightElbowAngle!
        );
        // Ensure right array has same length as left for zip-like operation
        const safeRight = right.slice(0, left.length);
        const asymmetry = Math.max(
          ...left.map((l, i) => Math.abs(l - safeRight[i]))
        );
        details = { peakElbowFlexion, bottomElbowExtension, asymmetry };
      }
    } else if (exercise === "jumps") {
      // Reset for next jump.
      peakAirborneY.current = null;
    }

    onNewRepData({ timestamp: Date.now(), score, details });

    // Call AI feedback once with complete rep context
    getAIFeedback({
      reps: internalReps + 1,
      formIssues: lastRepIssues.current,
      ...result.aiFeedbackPayload,
    });
  } else if (result.aiFeedbackPayload) {
    // Only call for non-rep-completion feedback (e.g., mid-rep corrections)
    getAIFeedback(result.aiFeedbackPayload);
  }
}
