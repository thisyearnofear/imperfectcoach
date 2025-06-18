import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { Exercise } from "@/lib/types";

interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  reps: number;
  exercise: Exercise;
  rank: number;
}

interface LeaderboardProps {
  timeframe?: 'today' | 'week' | 'month' | 'all';
}

// Mock data for both exercises
const mockLeaderboardData: LeaderboardEntry[] = [
  // Pull-ups
  { id: '1', username: 'FitnessPro', score: 98, reps: 25, exercise: 'pull-ups', rank: 1 },
  { id: '2', username: 'IronLifter', score: 95, reps: 22, exercise: 'pull-ups', rank: 2 },
  { id: '3', username: 'FormMaster', score: 92, reps: 20, exercise: 'pull-ups', rank: 3 },
  // Jumps
  { id: '4', username: 'JumpKing', score: 96, reps: 45, exercise: 'jumps', rank: 1 },
  { id: '5', username: 'AirWalker', score: 93, reps: 42, exercise: 'jumps', rank: 2 },
  { id: '6', username: 'SkyHopper', score: 89, reps: 38, exercise: 'jumps', rank: 3 },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Trophy className="h-3 w-3 text-yellow-500" />;
    case 2: return <Medal className="h-3 w-3 text-gray-400" />;
    case 3: return <Award className="h-3 w-3 text-amber-600" />;
    default: return <span className="text-xs text-muted-foreground">#{rank}</span>;
  }
};

const ExerciseLeaderboard = ({ exercise, data }: { exercise: Exercise; data: LeaderboardEntry[] }) => (
  <div className="space-y-1">
    <h4 className="text-sm font-medium capitalize text-center mb-2">{exercise}</h4>
    {data.slice(0, 3).map((entry) => (
      <div key={entry.id} className="flex items-center justify-between text-xs py-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {getRankIcon(entry.rank)}
          <span className="truncate font-medium">{entry.username}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span>{entry.score}%</span>
          <span>•</span>
          <span>{entry.reps}</span>
        </div>
      </div>
    ))}
  </div>
);

const Leaderboard = ({ timeframe = 'week' }: LeaderboardProps) => {
  const pullupData = mockLeaderboardData.filter(entry => entry.exercise === 'pull-ups');
  const jumpData = mockLeaderboardData.filter(entry => entry.exercise === 'jumps');

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-center">
          🏆 Weekly Leaders
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Desktop: Side by side */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
          <ExerciseLeaderboard exercise="pull-ups" data={pullupData} />
          <ExerciseLeaderboard exercise="jumps" data={jumpData} />
        </div>
        
        {/* Mobile: Stacked */}
        <div className="lg:hidden space-y-4">
          <ExerciseLeaderboard exercise="pull-ups" data={pullupData} />
          <ExerciseLeaderboard exercise="jumps" data={jumpData} />
        </div>
        
        {/* Coming Soon Notice - Compact */}
        <div className="mt-3 p-2 bg-muted/30 rounded border-dashed border text-center">
          <p className="text-xs text-muted-foreground">🚀 Sign up to compete!</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
