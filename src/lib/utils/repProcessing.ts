import { RepData, Exercise, JumpRepDetails } from "@/lib/types";
import { convertHeight } from "@/lib/heightConversion";

/**
 * Processes rep history for AI analysis
 * 
 * For jump exercises, converts jump heights to centimeters for consistent AI analysis.
 * For other exercises, returns the rep history as-is.
 * 
 * This utility is used in:
 * - PostWorkoutFlow (3 locations)
 * - BedrockAnalysisSection
 * - PerformanceAnalytics
 * 
 * @param repHistory - Array of rep data
 * @param exercise - Current exercise type
 * @param debug - Whether to log debug information
 * @returns Processed rep history with converted measurements
 */
export function processRepHistoryForAI(
  repHistory: RepData[],
  exercise: Exercise,
  debug = false
): RepData[] {
  // Only process jumps
  if (exercise !== "jumps") {
    return repHistory;
  }

  const processed = repHistory.map((rep, index) => {
    const original = rep.details as JumpRepDetails | undefined;
    
    if (!original || !("jumpHeight" in original)) {
      return rep;
    }

    const processed = {
      ...original,
      jumpHeight: Math.round(convertHeight(original.jumpHeight, "cm")),
      jumpHeightCm: Math.round(convertHeight(original.jumpHeight, "cm")),
    };

    // Debug logging for AI data transformation
    if (debug && process.env.NODE_ENV === "development") {
      console.log(`🤖 AI Data Transform Rep ${index + 1}:`, {
        originalJumpHeight: original.jumpHeight?.toFixed(1) ?? "null",
        originalLandingKnee:
          original.landingKneeFlexion?.toFixed(1) ?? "null",
        originalLandingScore: original.landingScore ?? "null",
        convertedJumpHeight: processed.jumpHeight,
        landingKneeToAI: processed.landingKneeFlexion ?? "null",
        landingScoreToAI: processed.landingScore ?? "null",
      });
    }

    return {
      ...rep,
      details: processed,
    };
  });

  return processed;
}

/**
 * Calculates comprehensive jump analytics from processed rep history
 * 
 * @param repHistory - Array of rep data (should be processed first)
 * @returns Jump analytics object or null if no jump data
 */
export function calculateJumpAnalytics(repHistory: RepData[]) {
  const jumpDetails = repHistory
    .map((rep) => rep.details)
    .filter(
      (details): details is JumpRepDetails =>
        details !== undefined && "jumpHeight" in details
    );

  if (jumpDetails.length === 0) {
    return null;
  }

  const jumpHeights = jumpDetails.map((d) => d.jumpHeight);
  const landingAngles = jumpDetails.map((d) => d.landingKneeFlexion);
  const landingScores = jumpDetails
    .map((d) => d.landingScore)
    .filter((s) => s !== undefined);

  const avgLandingAngle =
    landingAngles.reduce((a, b) => a + b, 0) / landingAngles.length;
  const avgJumpHeight =
    jumpHeights.reduce((a, b) => a + b, 0) / jumpHeights.length;
  const maxJumpHeight = Math.max(...jumpHeights);
  const goodLandings = landingAngles.filter((angle) => angle < 140).length;
  const landingSuccessRate = (goodLandings / landingAngles.length) * 100;

  return {
    totalJumps: jumpDetails.length,
    avgJumpHeight,
    maxJumpHeight,
    avgLandingAngle,
    bestLandingAngle: Math.min(...landingAngles),
    worstLandingAngle: Math.max(...landingAngles),
    avgLandingScore:
      landingScores.length > 0
        ? landingScores.reduce((a, b) => a + b, 0) / landingScores.length
        : 0,
    goodLandings,
    landingSuccessRate,
    landingProgression: landingAngles,
    heightProgression: jumpHeights,
  };
}

/**
 * Prepares complete workout data for AI analysis
 * Combines processed rep history with calculated analytics
 * 
 * @param repHistory - Array of rep data
 * @param exercise - Current exercise type
 * @param additionalData - Any additional workout data
 * @returns Complete data object ready for AI
 */
export function prepareWorkoutDataForAI(
  repHistory: RepData[],
  exercise: Exercise,
  additionalData: Record<string, unknown> = {}
) {
  const processedHistory = processRepHistoryForAI(repHistory, exercise);
  
  const data: Record<string, unknown> = {
    repHistory: processedHistory,
    exercise,
    ...additionalData,
  };

  if (exercise === "jumps") {
    const analytics = calculateJumpAnalytics(processedHistory);
    if (analytics) {
      data.jumpAnalytics = analytics;
    }
  }

  return data;
}
