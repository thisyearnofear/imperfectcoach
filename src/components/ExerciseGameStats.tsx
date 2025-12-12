import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Target, TrendingUp, Dumbbell, Activity } from 'lucide-react';
import { HeightUnit, Exercise } from '@/lib/types';
import { formatHeight } from '@/lib/heightConversion';

// ENHANCEMENT: Generic exercise stats that works for both jumps and pull-ups
interface ExerciseGameStatsProps {
  exercise: Exercise;
  stats: {
    personalBest: number;
    consistencyStreak: number;
    totalReps: number;
    avgScore?: number;
  };
  achievements: string[];
  showCelebration: boolean;
  heightUnit?: HeightUnit;
  className?: string;
}

const ExerciseGameStats: React.FC<ExerciseGameStatsProps> = ({
  exercise,
  stats,
  achievements,
  showCelebration,
  heightUnit = 'cm',
  className = ''
}) => {
  const getPowerLevelColor = (level: string) => {
    switch (level) {
      case 'elite': return 'bg-purple-100 text-purple-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getPowerLevelIcon = (level: string) => {
    switch (level) {
      case 'elite': return <Trophy className="h-4 w-4" />;
      case 'advanced': return <Zap className="h-4 w-4" />;
      case 'intermediate': return <Target className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getPowerLevel = (personalBest: number, avgScore?: number): 'beginner' | 'intermediate' | 'advanced' | 'elite' => {
    if (exercise === 'jumps') {
      const thresholds = { beginner: 30, intermediate: 50, advanced: 75, elite: 100 };
      if (personalBest >= thresholds.elite) return 'elite';
      if (personalBest >= thresholds.advanced) return 'advanced';
      if (personalBest >= thresholds.intermediate) return 'intermediate';
      return 'beginner';
    } else {
      // Pull-ups: based on rep count
      const thresholds = { beginner: 5, intermediate: 10, advanced: 20, elite: 30 };
      if (personalBest >= thresholds.elite) return 'elite';
      if (personalBest >= thresholds.advanced) return 'advanced';
      if (personalBest >= thresholds.intermediate) return 'intermediate';
      return 'beginner';
    }
  };

  const powerLevel = getPowerLevel(stats.personalBest, stats.avgScore);

  const getStatLabel = (): { best: string; consistency: string; total: string; avg: string } => {
    if (exercise === 'jumps') {
      return {
        best: 'Personal Best Height',
        consistency: 'Consistency Streak',
        total: 'Total Jumps',
        avg: 'Avg Height'
      };
    } else {
      return {
        best: 'Personal Best Reps',
        consistency: 'Strong Form Streak',
        total: 'Total Pull-ups',
        avg: 'Avg Form Score'
      };
    }
  };

  const labels = getStatLabel();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Power Level */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Power Level</span>
        <Badge className={`${getPowerLevelColor(powerLevel)} flex items-center gap-1`}>
          {getPowerLevelIcon(powerLevel)}
          {powerLevel.charAt(0).toUpperCase() + powerLevel.slice(1)}
        </Badge>
      </div>

      {/* Stats Grid - CLEAN: No duplication, layout works for both exercises */}
      <div className="grid grid-cols-2 gap-3">
        {/* Personal Best */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
          <div className="text-xs text-blue-600 font-medium">{labels.best}</div>
          <div className="text-lg font-bold text-blue-900">
            {exercise === 'jumps' ? formatHeight(stats.personalBest, heightUnit) : `${Math.floor(stats.personalBest)}`}
          </div>
        </div>
        
        {/* Consistency Streak */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
          <div className="text-xs text-green-600 font-medium">{labels.consistency}</div>
          <div className="text-lg font-bold text-green-900">{stats.consistencyStreak}</div>
        </div>
        
        {/* Total Reps/Jumps */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
          <div className="text-xs text-purple-600 font-medium">{labels.total}</div>
          <div className="text-lg font-bold text-purple-900">{Math.floor(stats.totalReps)}</div>
        </div>
        
        {/* Average Score/Height */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg">
          <div className="text-xs text-orange-600 font-medium">{labels.avg}</div>
          <div className="text-lg font-bold text-orange-900">
            {exercise === 'jumps' ? formatHeight(stats.avgScore || 0, heightUnit) : `${Math.round(stats.avgScore || 0)}`}
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2">Recent Achievements</div>
          <div className="flex flex-wrap gap-1">
            {achievements.slice(-3).map((achievement, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs animate-fade-in bg-yellow-100 text-yellow-800"
              >
                🏆 {achievement}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-xl font-bold animate-scale-in shadow-2xl">
            🎉 Session Complete! 🎉
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseGameStats;
