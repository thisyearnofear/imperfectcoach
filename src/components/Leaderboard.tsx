import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, Loader2, Activity } from "lucide-react";
import { Exercise, BlockchainScore } from "@/lib/types";
import { useUserBlockchain } from "@/hooks/useUserHooks";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import { SmartRefresh, RefreshButton } from "./SmartRefresh";
import { Badge } from "@/components/ui/badge";
import { useBasename } from "@/hooks/useBasename";

interface LeaderboardEntry {
  address: string;
  username: string;
  pullups: number;
  jumps: number;
  timestamp: number;
  rank: number;
}

interface LeaderboardProps {
  timeframe?: "today" | "week" | "month" | "all";
  exercise?: Exercise;
  currentUserAddress?: string;
  refreshTrigger?: number;
  compact?: boolean;
}

// Simple user display component (basename resolution temporarily disabled)
// Helper component for displaying user names/addresses
const UserDisplay = ({ address }: { address: string }) => {
  const { basename, isLoading } = useBasename(address);
  const displayName =
    basename || `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <span className="truncate font-medium" title={address}>
      {isLoading ? (
        <span className="text-muted-foreground">Loading...</span>
      ) : (
        displayName
      )}
    </span>
  );
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-3 w-3 text-yellow-500" />;
    case 2:
      return <Medal className="h-3 w-3 text-gray-400" />;
    case 3:
      return <Award className="h-3 w-3 text-amber-600" />;
    default:
      return <span className="text-xs text-muted-foreground">#{rank}</span>;
  }
};

const ExerciseLeaderboard = ({
  exercise,
  data,
  isLoading,
  compact = false,
}: {
  exercise: Exercise;
  data: LeaderboardEntry[];
  isLoading: boolean;
  compact?: boolean;
}) => (
  <div className="space-y-1">
    <h4 className="text-sm font-medium capitalize text-center mb-2">
      {exercise}
    </h4>
    {isLoading ? (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    ) : data.length === 0 ? (
      <div className="text-center py-4 text-xs text-muted-foreground">
        No scores yet
      </div>
    ) : (
      data.slice(0, compact ? 3 : 10).map((entry) => (
        <div
          key={entry.address}
          className="flex items-center justify-between text-xs py-1"
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {getRankIcon(entry.rank)}
            <UserDisplay address={entry.address} />
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>
              {exercise === "pull-ups" ? entry.pullups : entry.jumps} reps
            </span>
          </div>
        </div>
      ))
    )}
  </div>
);

const Leaderboard = ({
  timeframe = "week",
  exercise,
  currentUserAddress,
  refreshTrigger,
  compact = false,
}: LeaderboardProps) => {
  const { leaderboard, isLoading, pendingUpdates } = useUserBlockchain();
  const previousLeaderboardLength = useRef(leaderboard.length);

  // Basename resolver temporarily disabled to prevent infinite loop
  // const resolver = useBasenameResolver(...);

  // Process and sort leaderboard data
  const { pullupData, jumpData } = useMemo(() => {
    const processedData: LeaderboardEntry[] = leaderboard.map(
      (score, index) => ({
        address: score.user,
        username: score.user,
        pullups: score.pullups,
        jumps: score.jumps,
        timestamp: score.timestamp,
        rank: index + 1,
      })
    );

    // Sort by pullups (descending) and assign ranks
    const pullupSorted = [...processedData]
      .filter((entry) => entry.pullups > 0)
      .sort((a, b) => b.pullups - a.pullups)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    // Sort by jumps (descending) and assign ranks
    const jumpSorted = [...processedData]
      .filter((entry) => entry.jumps > 0)
      .sort((a, b) => b.jumps - a.jumps)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return {
      pullupData: pullupSorted,
      jumpData: jumpSorted,
    };
  }, [leaderboard]);

  // Preload basenames temporarily disabled
  // useEffect(() => {
  //   if (stableAddresses.length > 0) {
  //     resolver.preloadBasenames(stableAddresses);
  //   }
  // }, [stableAddresses, resolver]);

  // Check for new entries and show notification
  useEffect(() => {
    if (
      leaderboard.length > previousLeaderboardLength.current &&
      previousLeaderboardLength.current > 0
    ) {
      toast.success("🏆 New score added to leaderboard!");
    }
    previousLeaderboardLength.current = leaderboard.length;
  }, [leaderboard.length]);

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Compact mode - show specific exercise or both */}
        {exercise ? (
          <ExerciseLeaderboard
            exercise={exercise}
            data={exercise === "pull-ups" ? pullupData : jumpData}
            isLoading={isLoading}
            compact={true}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <ExerciseLeaderboard
              exercise="pull-ups"
              data={pullupData}
              isLoading={isLoading}
              compact={true}
            />
            <ExerciseLeaderboard
              exercise="jumps"
              data={jumpData}
              isLoading={isLoading}
              compact={true}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base content-center justify-center font-semibold">
            🏆 Onchain Olympians (in training)
            {pendingUpdates && (
              <span className="ml-2 relative">
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
              </span>
            )}
          </CardTitle>
          <RefreshButton size="sm" />
        </div>
        <SmartRefresh
          variant="minimal"
          size="sm"
          showStaleness={true}
          showLastRefresh={true}
          className="justify-center"
        />
        {isLoading && (
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading latest scores...
          </p>
        )}
        {/* Basename stats temporarily disabled */}
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {/* Desktop: Side by side */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
          <ExerciseLeaderboard
            exercise="pull-ups"
            data={pullupData}
            isLoading={isLoading}
            compact={false}
          />
          <ExerciseLeaderboard
            exercise="jumps"
            data={jumpData}
            isLoading={isLoading}
            compact={false}
          />
        </div>

        {/* Mobile: Stacked */}
        <div className="lg:hidden space-y-4">
          <ExerciseLeaderboard
            exercise="pull-ups"
            data={pullupData}
            isLoading={isLoading}
            compact={false}
          />
          <ExerciseLeaderboard
            exercise="jumps"
            data={jumpData}
            isLoading={isLoading}
            compact={false}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export { Leaderboard };
export default Leaderboard;
