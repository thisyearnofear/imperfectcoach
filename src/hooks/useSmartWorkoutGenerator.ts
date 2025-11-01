import { useState, useCallback } from 'react';

interface UserStats {
  averagePullups: number;
  averageJumps: number;
  personalBestPullups: number;
  personalBestJumps: number;
  recentSessions: number;
  currentStreak: number;
  preferredExercise?: 'pullups' | 'jumps' | 'mixed';
}

interface WorkoutGoal {
  type: 'strength' | 'endurance' | 'mixed' | 'challenge';
  duration: number; // minutes
  intensity: 'beginner' | 'intermediate' | 'advanced';
}

interface GeneratedWorkout {
  exercises: Array<{
    type: 'pullups' | 'jumps';
    sets: number;
    reps?: number;
    duration?: number; // for timed sets
    restTime: number; // seconds between sets
  }>;
  estimatedDuration: number;
  difficulty: string;
  motivation: string;
}

export const useSmartWorkoutGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateWorkout = useCallback(async (
    userStats: UserStats,
    goal: WorkoutGoal
  ): Promise<GeneratedWorkout> => {
    setIsGenerating(true);

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      const workout: GeneratedWorkout = {
        exercises: [],
        estimatedDuration: goal.duration,
        difficulty: goal.intensity,
        motivation: '',
      };

      // Base calculations on user stats
      const { averagePullups, averageJumps, personalBestPullups, personalBestJumps, recentSessions, currentStreak } = userStats;

      // Adjust targets based on intensity
      const intensityMultiplier = {
        beginner: 0.7,
        intermediate: 1.0,
        advanced: 1.3,
      }[goal.intensity];

      // Generate exercises based on goal type
      switch (goal.type) {
        case 'strength':
          // Focus on max effort sets
          if (userStats.preferredExercise === 'pullups' || userStats.preferredExercise === 'mixed') {
            workout.exercises.push({
              type: 'pullups',
              sets: 4,
              reps: Math.max(1, Math.round(personalBestPullups * intensityMultiplier * 0.8)),
              restTime: 180, // 3 minutes
            });
          }
          if (userStats.preferredExercise === 'jumps' || userStats.preferredExercise === 'mixed') {
            workout.exercises.push({
              type: 'jumps',
              sets: 4,
              reps: Math.max(5, Math.round(personalBestJumps * intensityMultiplier * 0.8)),
              restTime: 120, // 2 minutes
            });
          }
          workout.motivation = "💪 Push your limits! Strength comes from challenging yourself.";
          break;

        case 'endurance':
          // Focus on higher volume, shorter rests
          const enduranceSets = goal.intensity === 'advanced' ? 6 : goal.intensity === 'intermediate' ? 5 : 4;

          if (userStats.preferredExercise === 'pullups' || userStats.preferredExercise === 'mixed') {
            workout.exercises.push({
              type: 'pullups',
              sets: enduranceSets,
              reps: Math.max(3, Math.round(averagePullups * intensityMultiplier * 0.6)),
              restTime: 60, // 1 minute
            });
          }
          if (userStats.preferredExercise === 'jumps' || userStats.preferredExercise === 'mixed') {
            workout.exercises.push({
              type: 'jumps',
              sets: enduranceSets,
              reps: Math.max(10, Math.round(averageJumps * intensityMultiplier * 0.6)),
              restTime: 45, // 45 seconds
            });
          }
          workout.motivation = "🔄 Build endurance! Consistency is your superpower.";
          break;

        case 'mixed':
          // Balanced approach
          workout.exercises.push(
            {
              type: 'pullups',
              sets: 3,
              reps: Math.max(3, Math.round(averagePullups * intensityMultiplier)),
              restTime: 90,
            },
            {
              type: 'jumps',
              sets: 3,
              reps: Math.max(8, Math.round(averageJumps * intensityMultiplier)),
              restTime: 90,
            }
          );
          workout.motivation = "⚖️ Balance is key! Mix it up for full-body strength.";
          break;

        case 'challenge':
          // Push personal bests
          workout.exercises.push({
            type: userStats.preferredExercise === 'pullups' ? 'pullups' : 'jumps',
            sets: 5,
            reps: Math.round((userStats.preferredExercise === 'pullups' ? personalBestPullups : personalBestJumps) * 1.1),
            restTime: 150,
          });
          workout.motivation = "🏔️ Challenge accepted! Break through your limits today.";
          break;
      }

      // Add streak-based motivation
      if (currentStreak > 5) {
        workout.motivation += ` You're on fire with a ${currentStreak}-day streak! 🔥`;
      } else if (recentSessions < 3) {
        workout.motivation += " Every journey starts with a single rep. You've got this! 🌟";
      }

      return workout;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const getWorkoutSuggestions = useCallback((userStats: UserStats) => {
    const suggestions = [];

    // Based on recent activity
    if (userStats.recentSessions === 0) {
      suggestions.push({
        type: 'mixed' as const,
        duration: 10,
        intensity: 'beginner' as const,
        reason: "Welcome back! Start with a balanced workout to get back in the groove.",
      });
    } else if (userStats.currentStreak > 7) {
      suggestions.push({
        type: 'challenge' as const,
        duration: 15,
        intensity: 'advanced' as const,
        reason: "You're on a roll! Time to push your personal bests.",
      });
    } else if (userStats.averagePullups > userStats.averageJumps) {
      suggestions.push({
        type: 'strength' as const,
        duration: 12,
        intensity: 'intermediate' as const,
        reason: "Focus on building jump strength to balance your routine.",
      });
    } else {
      suggestions.push({
        type: 'endurance' as const,
        duration: 15,
        intensity: 'intermediate' as const,
        reason: "Build endurance with higher volume training.",
      });
    }

    return suggestions;
  }, []);

  return {
    generateWorkout,
    getWorkoutSuggestions,
    isGenerating,
  };
};
