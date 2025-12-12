import React from 'react';
import { HeightUnit } from '@/lib/types';
import ExerciseGameStats from '@/components/ExerciseGameStats';

interface JumpStats {
  personalBest: number;
  consistencyStreak: number;
  totalJumps: number;
  avgHeight: number;
  powerLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
}

interface JumpGameificationProps {
  jumpStats: JumpStats;
  achievements: string[];
  showCelebration: boolean;
  heightUnit: HeightUnit;
  className?: string;
}

// ENHANCEMENT FIRST: Use generic ExerciseGameStats instead of duplicating code
// Maintains backward compatibility while reducing code duplication
const JumpGameification: React.FC<JumpGameificationProps> = ({
  jumpStats,
  achievements,
  showCelebration,
  heightUnit,
  className = ''
}) => {
  return (
    <ExerciseGameStats
      exercise="jumps"
      stats={{
        personalBest: jumpStats.personalBest,
        consistencyStreak: jumpStats.consistencyStreak,
        totalReps: jumpStats.totalJumps,
        avgScore: jumpStats.avgHeight
      }}
      achievements={achievements}
      showCelebration={showCelebration}
      heightUnit={heightUnit}
      className={className}
    />
  );
};

export default JumpGameification;
