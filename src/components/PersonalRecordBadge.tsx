import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, TrendingUp } from 'lucide-react';

interface PersonalRecordBadgeProps {
  exercise: 'pull-ups' | 'jumps';
  reps?: number;
  formScore?: number;
  jumpHeight?: number;
  heightUnit?: 'cm' | 'inches' | 'feet' | 'meters';
}

const PersonalRecordBadge: React.FC<PersonalRecordBadgeProps> = ({ 
  exercise, 
  reps, 
  formScore, 
  jumpHeight,
  heightUnit = 'cm'
}) => {
  if (reps === undefined && formScore === undefined && jumpHeight === undefined) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {reps !== undefined && reps > 0 && (
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
          <Trophy className="h-3 w-3 mr-1" />
          Best: {reps} {exercise}
        </Badge>
      )}
      
      {formScore !== undefined && formScore > 0 && (
        <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
          <Target className="h-3 w-3 mr-1" />
          Form: {Math.round(formScore)}%
        </Badge>
      )}
      
      {jumpHeight !== undefined && jumpHeight > 0 && exercise === 'jumps' && (
        <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
          <TrendingUp className="h-3 w-3 mr-1" />
          Jump: {jumpHeight.toFixed(1)} {heightUnit}
        </Badge>
      )}
    </div>
  );
};

export default PersonalRecordBadge;