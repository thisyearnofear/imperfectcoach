/**
 * Score Color Utilities
 * 
 * Consolidates form score → color mapping logic used throughout the app.
 * Provides consistent color coding for scores, progress bars, and badges.
 */

export interface ScoreColorResult {
  /** Text color class (e.g., "text-green-500") */
  text: string;
  /** Background color class (e.g., "bg-green-500") */
  bg: string;
  /** Border color class (e.g., "border-green-500") */
  border: string;
  /** Raw color value for custom use cases */
  value: "green" | "yellow" | "red";
  /** Semantic label */
  label: "excellent" | "good" | "needs-work";
}

/**
 * Standard score thresholds used across the app
 */
export const SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60,
} as const;

/**
 * Gets color classes for a form score
 * 
 * @param score - Form score (0-100)
 * @param variant - Color variant (default uses Tailwind colors)
 * @returns Object with text, bg, border color classes
 * 
 * @example
 * ```tsx
 * const colors = getScoreColor(85);
 * <span className={colors.text}>{score}</span>
 * <Progress indicatorClassName={colors.bg} />
 * ```
 */
export function getScoreColor(
  score: number,
  variant: "default" | "destructive" = "default"
): ScoreColorResult {
  if (score >= SCORE_THRESHOLDS.excellent) {
    return {
      text: "text-green-500",
      bg: "bg-green-500",
      border: "border-green-500",
      value: "green",
      label: "excellent",
    };
  }
  
  if (score >= SCORE_THRESHOLDS.good) {
    return {
      text: "text-yellow-500",
      bg: "bg-yellow-500",
      border: "border-yellow-500",
      value: "yellow",
      label: "good",
    };
  }
  
  // Poor score
  const redClass = variant === "destructive" ? "destructive" : "red-500";
  return {
    text: `text-${redClass}`,
    bg: `bg-${redClass}`,
    border: `border-${redClass}`,
    value: "red",
    label: "needs-work",
  };
}

/**
 * Gets just the text color class for a score
 * Convenience function for the most common use case
 */
export function getScoreTextColor(score: number): string {
  return getScoreColor(score).text;
}

/**
 * Gets just the background color class for a score
 * Useful for progress bars and indicators
 */
export function getScoreBgColor(score: number): string {
  return getScoreColor(score).bg;
}

/**
 * Gets just the border color class for a score
 */
export function getScoreBorderColor(score: number): string {
  return getScoreColor(score).border;
}

/**
 * Gets a human-readable label for a score
 */
export function getScoreLabel(score: number): string {
  if (score >= SCORE_THRESHOLDS.excellent) return "Excellent";
  if (score >= SCORE_THRESHOLDS.good) return "Good";
  return "Needs Work";
}

/**
 * Checks if a score is considered "good enough"
 */
export function isGoodScore(score: number): boolean {
  return score >= SCORE_THRESHOLDS.good;
}

/**
 * Checks if a score is considered "excellent"
 */
export function isExcellentScore(score: number): boolean {
  return score >= SCORE_THRESHOLDS.excellent;
}
