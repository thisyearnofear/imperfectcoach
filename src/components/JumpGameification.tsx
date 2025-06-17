
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Target, TrendingUp } from 'lucide-react';

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
  className?: string;
}

const JumpGameification: React.FC<JumpGameificationProps> = ({
  jumpStats,
  achievements,
  showCelebration,
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Power Level */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Power Level</span>
        <Badge className={`${getPowerLevelColor(jumpStats.powerLevel)} flex items-center gap-1`}>
          {getPowerLevelIcon(jumpStats.powerLevel)}
          {jumpStats.powerLevel.charAt(0).toUpperCase() + jumpStats.powerLevel.slice(1)}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
          <div className="text-xs text-blue-600 font-medium">Personal Best</div>
          <div className="text-lg font-bold text-blue-900">{Math.round(jumpStats.personalBest)}px</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
          <div className="text-xs text-green-600 font-medium">Consistency</div>
          <div className="text-lg font-bold text-green-900">{jumpStats.consistencyStreak}</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
          <div className="text-xs text-purple-600 font-medium">Total Jumps</div>
          <div className="text-lg font-bold text-purple-900">{jumpStats.totalJumps}</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg">
          <div className="text-xs text-orange-600 font-medium">Avg Height</div>
          <div className="text-lg font-bold text-orange-900">{Math.round(jumpStats.avgHeight)}px</div>
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

export default JumpGameification;
