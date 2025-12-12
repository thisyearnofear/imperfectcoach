import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CoachPersonality, WorkoutMode } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { getCoachInfo, COACH_PERSONALITIES } from "@/lib/coachPersonalities";
import { Dumbbell, Activity } from "lucide-react";

interface CoachFeedbackProps {
  reps: number;
  formFeedback: string;
  formScore: number;
  coachPersonality: CoachPersonality;
  workoutMode: WorkoutMode;
  onPremiumUpgrade?: () => void;
  variant?: "full" | "compact";
  showModeExplanation?: boolean;
  onModeExplanationShown?: () => void;
  showFocusExplanation?: boolean;
  onFocusExplanationShown?: () => void;
  isFocusMode?: boolean;
  // ENHANCEMENT: Streak tracking and form breakdown
  formStreak?: number;
  formBreakdown?: { symmetry: 'good' | 'warning' | 'poor'; romTop: 'good' | 'warning' | 'poor'; romBottom: 'good' | 'warning' | 'poor' };
}

const CoachFeedback = ({
  reps,
  formFeedback,
  formScore,
  coachPersonality,
  workoutMode,
  onPremiumUpgrade,
  variant = "full",
  showModeExplanation = false,
  onModeExplanationShown,
  showFocusExplanation = false,
  onFocusExplanationShown,
  isFocusMode = false,
  formStreak = 0,
  formBreakdown,
}: CoachFeedbackProps) => {
  const [currentCoachIndex, setCurrentCoachIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [lastRepCount, setLastRepCount] = useState(0);
  const [showRepCelebration, setShowRepCelebration] = useState(false);
  const [showFormBreakdown, setShowFormBreakdown] = useState(false);

  // ENHANCEMENT: Detect rep completion and trigger celebration
  useEffect(() => {
    if (reps > lastRepCount && reps > 0) {
      setShowRepCelebration(true);
      setTimeout(() => setShowRepCelebration(false), 1000);
      setLastRepCount(reps);
    }
  }, [reps, lastRepCount]);

  // Debug focus explanation
  useEffect(() => {
    if (showFocusExplanation) {
      console.log('🎯 CoachFeedback: showFocusExplanation is true, isFocusMode:', isFocusMode);
    }
  }, [showFocusExplanation, isFocusMode]);

  const coaches = Object.values(COACH_PERSONALITIES);
  const exercises = [
    {
      name: "Pull-ups",
      icon: <Dumbbell className="h-5 w-5" />,
      benefits: [
        "Build functional upper body strength",
        "Support healthy aging with bone density",
        "Boost mental resilience through progressive challenges",
        "Improve posture for better spinal health"
      ],
      shortBenefit: "Build upper body strength",
      description: "Master the king of bodyweight exercises"
    },
    {
      name: "Jumps",
      icon: <Activity className="h-5 w-5" />,
      benefits: [
        "Enhance cardiovascular wellness",
        "Build bone density for long-term health",
        "Improve coordination and balance",
        "Release endorphins for mental well-being"
      ],
      shortBenefit: "Explosive power & cardio",
      description: "Train for athletic movements"
    }
  ];

  // Cycle through coaches and exercises when not actively working out
  useEffect(() => {
    // Always cycle when reps are 0 (pre-workout state), regardless of formFeedback
    if (reps === 0) {
      const coachInterval = setInterval(() => {
        setCurrentCoachIndex((prev) => (prev + 1) % coaches.length);
      }, 6000); // Slower cycling for better readability

      const exerciseInterval = setInterval(() => {
        setCurrentExerciseIndex((prev) => (prev + 1) % exercises.length);
      }, 8000); // Slower cycling

      return () => {
        clearInterval(coachInterval);
        clearInterval(exerciseInterval);
      };
    }
  }, [reps, coaches.length, exercises.length]);

  const getScoreColor = () => {
    // ENHANCEMENT: Show all scores as encouraging during learning phase
    if (reps <= 2) return "text-blue-500"; // Learning phase: blue (neutral, encouraging)
    if (formScore >= 80) return "text-green-500";
    if (formScore >= 60) return "text-yellow-500";
    return "text-destructive";
  };

  const getProgressColor = () => {
    // ENHANCEMENT: Learning phase gets blue progress bar
    if (reps <= 2) return "bg-blue-500";
    if (formScore >= 80) return "bg-green-500";
    if (formScore >= 60) return "bg-yellow-500";
    return "bg-destructive";
  };

  const coach = getCoachInfo(coachPersonality);
  const currentCoach = coaches[currentCoachIndex];
  const currentExercise = exercises[currentExerciseIndex];

  const getModeExplanation = () => {
    if (workoutMode === "training") {
      return {
        title: "🏋️ Training Mode",
        description: "Focus on building strength and improving form. Get real-time coaching to perfect your technique.",
        benefits: ["Form corrections", "Progressive overload", "Technique tips", "Motivation"]
      };
    } else {
      return {
        title: "📊 Assessment Mode",
        description: "Measure your current fitness level. Get scored on form quality and rep count for benchmarking.",
        benefits: ["Performance scoring", "Baseline measurement", "Progress tracking", "Objective feedback"]
      };
    }
  };

  const getFocusExplanation = () => {
    if (isFocusMode) {
      return {
        title: "🎯 Focus Mode ON",
        description: "Minimalist interface activated. Only essential workout info is shown to reduce distractions.",
        benefits: ["Clean interface", "Essential metrics only", "Better concentration", "Reduced visual clutter"]
      };
    } else {
      return {
        title: "🎯 Focus Mode OFF",
        description: "Full interface with all controls and information visible for complete workout management.",
        benefits: ["All controls visible", "Complete information", "Full customization", "Rich feedback"]
      };
    }
  };

  const getFormBreakdownEmoji = () => {
    if (!formBreakdown) return '';
    const sym = formBreakdown.symmetry === 'good' ? '✓' : formBreakdown.symmetry === 'warning' ? '⚠️' : '✗';
    const top = formBreakdown.romTop === 'good' ? '✓' : formBreakdown.romTop === 'warning' ? '⚠️' : '✗';
    const bot = formBreakdown.romBottom === 'good' ? '✓' : formBreakdown.romBottom === 'warning' ? '⚠️' : '✗';
    return `${sym}${top}${bot}`;
  };

  const isLearningPhase = reps <= 2;

  const getTitle = () => {
    if (showFocusExplanation) {
      return getFocusExplanation().title;
    }
    if (showModeExplanation) {
      return getModeExplanation().title;
    }
    // Show current cycling coach when not actively working out (reps === 0)
    if (reps === 0) {
      return `${currentCoach.emoji} ${currentCoach.name} says...`;
    }
    // ENHANCEMENT: Show learning phase indicator during first two reps
    const phaseIndicator = isLearningPhase ? ' (Learning Mode)' : '';
    return `${coach.emoji} ${coach.name} says...${phaseIndicator}`;
  };

  const getFeedbackStyle = () => {
    const feedbackLower = formFeedback.toLowerCase();

    // During active workout, always use larger text for better readability
    const textSize = reps > 0 ? "text-2xl" : "text-lg";

    // ENHANCEMENT FIRST: Positive/inviting states during calibration and success
    if (
      feedbackLower.includes("ready") ||
      feedbackLower.includes("perfect") ||
      feedbackLower.includes("start position") ||
      feedbackLower.includes("getting ready") ||
      feedbackLower.includes("great") ||
      feedbackLower.includes("first jump") ||
      feedbackLower.includes("nice") ||
      feedbackLower.includes("excellent") ||
      feedbackLower.includes("amazing") ||
      feedbackLower.includes("awesome") ||
      feedbackLower.includes("whenever you're ready") ||
      feedbackLower.includes("i see you")
    ) {
      return `text-green-500 ${textSize} font-bold`;
    }

    // Error/critical states: red (only for actual problems, not setup)
    if (
      feedbackLower.includes("can't see you") ||
      feedbackLower.includes("trouble seeing") ||
      feedbackLower.includes("denied") ||
      feedbackLower.includes("poor form") ||
      feedbackLower.includes("form too") ||
      feedbackLower.includes("fix your form")
    ) {
      return `text-destructive ${textSize} font-bold`;
    }

    // Corrective/warning states: yellow (tips, not criticisms)
    if (
      feedbackLower.includes("hang from") ||
      feedbackLower.includes("pull evenly") ||
      feedbackLower.includes("higher") ||
      feedbackLower.includes("full extension") ||
      feedbackLower.includes("chin over") ||
      feedbackLower.includes("make sure") ||
      feedbackLower.includes("evenly") ||
      feedbackLower.includes("keep") ||
      feedbackLower.includes("maintain") ||
      feedbackLower.includes("try") ||
      feedbackLower.includes("focus") ||
      feedbackLower.includes("work on") ||
      feedbackLower.includes("stand naturally")
    ) {
      return `text-yellow-500 ${textSize} font-semibold`;
    }

    // Default/neutral - still use larger text during workout
    return reps > 0
      ? `text-primary ${textSize} font-medium`
      : "text-muted-foreground text-lg";
  };

  return (
    <div className="bg-card p-4 rounded-lg border border-border/40 h-full flex flex-col">
      <motion.h3
        className="text-lg font-semibold mb-3 text-primary"
        key={getTitle()}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {getTitle()}
      </motion.h3>

      <div className="flex-grow flex items-center justify-center p-2 min-h-[60px]">
        {showFocusExplanation ? (
          // Show focus mode explanation when toggled
          <AnimatePresence mode="wait">
            <motion.div
              key={`focus-${isFocusMode}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-3 w-full"
              onAnimationComplete={() => {
                // Auto-hide explanation after 4 seconds
                setTimeout(() => {
                  onFocusExplanationShown?.();
                }, 4000);
              }}
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {getFocusExplanation().description}
                </p>
                <div className="flex flex-wrap justify-center gap-1">
                  {getFocusExplanation().benefits.map((benefit, idx) => (
                    <motion.span
                      key={benefit}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + idx * 0.1 }}
                    >
                      {benefit}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : showModeExplanation ? (
          // Show mode explanation when toggled
          <AnimatePresence mode="wait">
            <motion.div
              key={workoutMode}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-3 w-full"
              onAnimationComplete={() => {
                // Auto-hide explanation after 4 seconds
                setTimeout(() => {
                  onModeExplanationShown?.();
                }, 4000);
              }}
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {getModeExplanation().description}
                </p>
                <div className="flex flex-wrap justify-center gap-1">
                  {getModeExplanation().benefits.map((benefit, idx) => (
                    <motion.span
                      key={benefit}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + idx * 0.1 }}
                    >
                      {benefit}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : reps === 0 ? (
          // Show cycling content when not actively working out (more compact)
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentCoachIndex}-${currentExerciseIndex}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-2"
            >
              {/* More compact coach personality teaser */}
              <div className="space-y-1">
                <motion.div
                  className="text-xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {currentCoach.emoji}
                </motion.div>
                <p className="text-xs text-muted-foreground italic">
                  "{currentCoach.description}"
                </p>
                <p className="text-sm font-medium">
                  {currentCoach.motivationalPhrase}
                </p>
              </div>

              {/* More compact exercise showcase */}
              <motion.div
                className="border-t border-border/40 pt-2 space-y-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-center gap-2">
                  {currentExercise.icon}
                  <span className="font-semibold text-sm">{currentExercise.name}</span>
                </div>
                <p className="text-xs text-primary font-medium">
                  {currentExercise.shortBenefit}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        ) : (
          // Show active feedback when working out
          <motion.div
            key={formFeedback}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center w-full px-2"
          >
            <p
              className={`text-center break-words transition-all duration-300 max-w-full ${getFeedbackStyle()}`}
            >
              {formFeedback}
            </p>
          </motion.div>
        )}
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

      <div className="mt-3 space-y-3">
        {/* ENHANCEMENT: Learning phase badge */}
        {isLearningPhase && reps > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mx-auto"
          >
            <span>🎯 Learning Mode - Full scoring at rep 3</span>
          </motion.div>
        )}

        {/* ENHANCEMENT: Streak counter (shows when active) */}
        {formStreak > 1 && reps > 0 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center gap-1 text-sm font-semibold text-orange-600"
          >
            <span>🔥 {formStreak}-Rep Streak</span>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <h4 className="text-sm font-medium text-muted-foreground">Reps</h4>
            <motion.span 
              key={reps}
              initial={showRepCelebration ? { scale: 1 } : undefined}
              animate={showRepCelebration ? { scale: 1.3 } : undefined}
              transition={{ duration: 0.6, type: "spring" }}
              className="text-primary font-bold text-2xl block"
            >
              {reps}
            </motion.span>
            {/* ENHANCEMENT: Rep celebration indicator */}
            {showRepCelebration && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-xs text-green-600 font-semibold mt-1"
              >
                ✓ Logged
              </motion.div>
            )}
          </div>
          <div className="text-center relative">
            <h4 className="text-sm font-medium text-muted-foreground">Form Score</h4>
            <motion.button
              onClick={() => formBreakdown && setShowFormBreakdown(!showFormBreakdown)}
              className={`font-bold text-2xl cursor-pointer hover:opacity-70 transition-opacity ${getScoreColor()}`}
              whileHover={{ scale: formBreakdown ? 1.1 : 1 }}
            >
              {formScore.toFixed(0)}
              {/* ENHANCEMENT: Form breakdown indicator tooltip */}
              {formBreakdown && (
                <span className="text-xs ml-1 opacity-60">{getFormBreakdownEmoji()}</span>
              )}
            </motion.button>
            {/* ENHANCEMENT: Form breakdown tooltip on click */}
            {showFormBreakdown && formBreakdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-full mt-2 right-0 bg-gray-900 text-white text-xs rounded p-2 whitespace-nowrap z-20 text-left w-48"
              >
                <div className="space-y-1">
                  <div>Symmetry: {formBreakdown.symmetry === 'good' ? '✓ Good' : formBreakdown.symmetry === 'warning' ? '⚠️ Slight asymmetry' : '✗ Work on balance'}</div>
                  <div>Top ROM: {formBreakdown.romTop === 'good' ? '✓ Full' : formBreakdown.romTop === 'warning' ? '⚠️ Partial' : '✗ Increase range'}</div>
                  <div>Bottom ROM: {formBreakdown.romBottom === 'good' ? '✓ Full' : formBreakdown.romBottom === 'warning' ? '⚠️ Partial' : '✗ Full extension'}</div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        <Progress
          value={formScore}
          className="h-2"
          indicatorClassName={getProgressColor()}
        />
      </div>
    </div>
  );
};

export default CoachFeedback;
