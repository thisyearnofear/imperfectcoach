/**
 * Leaderboard utility functions
 * Single source of truth for leaderboard data transformation and merging
 */

export interface ExerciseEntry {
  user: string;
  totalScore: bigint;
  lastSubmissionTime: bigint;
  submissionCount?: bigint;
}

export interface MergedUserData {
  pullups: number;
  jumps: number;
  lastSubmissionTime: number;
}

/**
 * Merge two exercise datasets (jumps + pullups) by user address
 * Uses Map for O(1) lookups instead of array.findIndex() O(n)
 * Handles missing fields gracefully
 */
export function mergeExerciseData(
  jumpsData: ExerciseEntry[] | undefined,
  pullupsData: ExerciseEntry[] | undefined
): Map<string, MergedUserData> {
  const userMap = new Map<string, MergedUserData>();

  // Process jumps data
  if (jumpsData?.length) {
    jumpsData.forEach((entry) => {
      userMap.set(entry.user, {
        pullups: 0,
        jumps: Number(entry.totalScore),
        lastSubmissionTime: Number(entry.lastSubmissionTime),
      });
    });
  }

  // Process pullups data and merge
  if (pullupsData?.length) {
    pullupsData.forEach((entry) => {
      const existing = userMap.get(entry.user);
      if (existing) {
        existing.pullups = Number(entry.totalScore);
        existing.lastSubmissionTime = Math.max(
          existing.lastSubmissionTime,
          Number(entry.lastSubmissionTime)
        );
      } else {
        userMap.set(entry.user, {
          pullups: Number(entry.totalScore),
          jumps: 0,
          lastSubmissionTime: Number(entry.lastSubmissionTime),
        });
      }
    });
  }

  return userMap;
}
