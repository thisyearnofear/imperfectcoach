import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, Loader2, Activity, Users, Target, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Exercise, BlockchainScore } from "@/lib/types";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import { SmartRefresh, RefreshButton } from "./SmartRefresh";
import { Badge } from "@/components/ui/badge";
import { useBasename } from "@/hooks/useBasename";
import { useMemoryIdentity, useSolanaNameService } from "@/hooks/useMemoryIdentity";
import { useSocialContext } from "@/contexts/SocialContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLeaderboardParallel, ChainFilter } from "@/hooks/useLeaderboardParallel";
import { LeaderboardListSkeleton } from "@/components/SkeletonLoaders";

interface LeaderboardEntry {
  address: string;
  username: string;
  pullups: number;
  jumps: number;
  timestamp: number;
  rank: number;
  chain?: "base" | "solana" | "avalanche";
}

interface LeaderboardProps {
  timeframe?: "today" | "week" | "month" | "all";
  exercise?: Exercise;
  currentUserAddress?: string;
  refreshTrigger?: number;
  compact?: boolean;
  chainFilter?: ChainFilter;
}

// Chain badge component
const ChainBadge = ({ chain }: { chain?: "base" | "avalanche" | "solana" }) => {
  if (!chain) return null;

  switch (chain) {
    case "solana":
      return (
        <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs">
          SOL
        </Badge>
      );
    case "avalanche":
      return (
        <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400 text-xs">
          AVAX
        </Badge>
      );
    default: // base
      return (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs">
          BASE
        </Badge>
      );
  }
};

// Enhanced user display component with social identity support
const UserDisplay = ({ address, chain, showActions = false }: { address: string; chain?: "base" | "avalanche" | "solana"; showActions?: boolean }) => {
  const { basename, isLoading: basenameLoading } = useBasename(address);
  const { getPrimarySocialIdentity, isLoading: identityLoading } = useMemoryIdentity(address, {
    enabled: !basenameLoading && !basename // Only fetch if no basename
  });
  const { solName, isLoading: snsLoading } = useSolanaNameService(chain === "solana" ? address : undefined);

  const { getFriendActivity, addSocialActivity } = useSocialContext();
  const [isChallenging, setIsChallenging] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<number>(10); // Default challenge target
  const [challengeExercise, setChallengeExercise] = useState<Exercise>('jumps');
  
  const socialIdentity = getPrimarySocialIdentity();

  let displayName: string;
  let displayIcon: string | null = null;

  if (basenameLoading || identityLoading || snsLoading) {
    displayName = "Loading...";
  } else if (socialIdentity) {
    displayName = socialIdentity.username || socialIdentity.id;
    // Add platform indicator
    if (socialIdentity.platform === 'farcaster') {
      displayIcon = '🟣'; // Purple circle for Farcaster
    } else if (socialIdentity.platform === 'twitter') {
      displayIcon = '🐦'; // Bird for Twitter
    }
  } else if (basename) {
    displayName = basename;
  } else if (solName) {
    displayName = solName;
  } else {
    displayName = `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  const handleChallengeFriend = () => {
    setIsChallenging(true);
  };

  const confirmChallenge = () => {
    addSocialActivity({
      type: 'challenge',
      userId: address,
      message: `Challenged to ${challengeTarget} ${challengeExercise}!`,
      timestamp: Date.now(),
      exercise: challengeExercise,
      reps: challengeTarget,
    });
    
    toast.success(`Challenge sent to ${displayName}!`);
    setIsChallenging(false);
  };

  return (
    <div className="flex items-center justify-between w-full gap-2">
      <span className="truncate font-medium flex items-center gap-1" title={address}>
        {displayIcon && <span className="text-xs">{displayIcon}</span>}
        <span className={basenameLoading || identityLoading ? "text-muted-foreground" : ""}>
          {displayName}
        </span>
      </span>
      <ChainBadge chain={chain} />
      
      {showActions && (
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleChallengeFriend}
              className="h-6 px-2 text-xs"
            >
              Challenge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Challenge {displayName}</DialogTitle>
              <DialogDescription>
                Set a workout challenge for your friend
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Exercise</label>
                <Select value={challengeExercise} onValueChange={(value: Exercise) => setChallengeExercise(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jumps">Jumps</SelectItem>
                    <SelectItem value="pull-ups">Pull-ups</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Target Reps</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={challengeTarget}
                  onChange={(e) => setChallengeTarget(parseInt(e.target.value) || 10)}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <Button onClick={confirmChallenge} className="w-full">
                Send Challenge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
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
      <LeaderboardListSkeleton count={compact ? 3 : 10} />
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
            <UserDisplay 
              address={entry.address}
              chain={entry.chain}
              showActions={true} // Show challenge button for non-compact view
            />
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
  chainFilter = "all",
}: LeaderboardProps) => {
  const { leaderboard, isLoading, error, refetch } = useLeaderboardParallel({
    chain: chainFilter,
  });
  const { friendAddresses } = useSocialContext();
  const previousLeaderboardLength = useRef(leaderboard.length);
  const hasCompletedInitialLoad = useRef(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'all' | 'friends'>('all');
  const [chainFilterView, setChainFilterView] = useState<ChainFilter>(chainFilter);

  // Basename resolver temporarily disabled to prevent infinite loop
  // const resolver = useBasenameResolver(...);

  // Process and sort leaderboard data
  const { pullupData, jumpData, friendPullupData, friendJumpData } = useMemo(() => {
    const processedData: LeaderboardEntry[] = leaderboard.map(
      (score) => ({
        address: score.user,
        username: score.user,
        pullups: score.pullups,
        jumps: score.jumps,
        timestamp: score.lastSubmissionTime,
        rank: score.rank || 0,
        chain: score.chain,
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

    // Filter for friends
    const friendPullupSorted = pullupSorted.filter(entry => friendAddresses.includes(entry.address));
    const friendJumpSorted = jumpSorted.filter(entry => friendAddresses.includes(entry.address));

    return {
      pullupData: pullupSorted,
      jumpData: jumpSorted,
      friendPullupData: friendPullupSorted,
      friendJumpData: friendJumpSorted,
    };
  }, [leaderboard, friendAddresses]);

  // Get current data based on view mode
  const getCurrentData = (exerciseType: Exercise) => {
    if (viewMode === 'friends') {
      return exerciseType === 'pull-ups' ? friendPullupData : friendJumpData;
    }
    return exerciseType === 'pull-ups' ? pullupData : jumpData;
  };

  // Preload basenames temporarily disabled
  // useEffect(() => {
  //   if (stableAddresses.length > 0) {
  //     resolver.preloadBasenames(stableAddresses);
  //   }
  // }, [stableAddresses, resolver]);

  // Track when the initial multi-chain load has fully completed
  useEffect(() => {
    if (!isLoading && !hasCompletedInitialLoad.current) {
      hasCompletedInitialLoad.current = true;
      previousLeaderboardLength.current = leaderboard.length;
    }
  }, [isLoading, leaderboard.length]);

  // Check for new entries and show notification (skip initial load)
  useEffect(() => {
    if (
      hasCompletedInitialLoad.current &&
      leaderboard.length > previousLeaderboardLength.current &&
      previousLeaderboardLength.current > 0
    ) {
      toast.success("🏆 New score added to leaderboard!");
    }
    previousLeaderboardLength.current = leaderboard.length;
  }, [leaderboard.length]);

  // Auto-rotate preview cards for compact mode
  useEffect(() => {
    if (compact && pullupData.length > 0) {
      const interval = setInterval(() => {
        setCurrentPreviewIndex((prev) => (prev + 1) % Math.min(pullupData.length, 3));
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [compact, pullupData.length]);

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Compact mode - show rotating preview cards */}
        {!exercise && pullupData.length > 0 && (
          <div className="relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {viewMode === 'friends' ? 'Friends' : 'Global'} Leaderboard
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  size="xs" 
                  variant={viewMode === 'all' ? 'default' : 'outline'} 
                  onClick={() => setViewMode('all')}
                  className="h-6 px-2 text-xs"
                >
                  All
                </Button>
                <Button 
                  size="xs" 
                  variant={viewMode === 'friends' ? 'default' : 'outline'} 
                  onClick={() => setViewMode('friends')}
                  className="h-6 px-2 text-xs"
                >
                  Friends
                </Button>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPreviewIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="flex gap-2"
              >
                {[
                  getCurrentData('pull-ups')[currentPreviewIndex], 
                  getCurrentData('jumps')[currentPreviewIndex]
                ].map((entry, idx) => {
                  if (!entry) return null;
                  const exerciseType = idx === 0 ? "pull-ups" : "jumps";
                  const reps = idx === 0 ? entry.pullups : entry.jumps;

                  return (
                    <motion.div
                      key={`${entry.address}-${exerciseType}`}
                      className="flex-1 bg-card/50 rounded-lg p-3 border border-border/40"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {getRankIcon(entry.rank)}
                          <span className="text-xs font-medium capitalize">{exerciseType}</span>
                        </div>
                        <motion.div
                          className="text-xs text-muted-foreground"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {reps} reps
                        </motion.div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((reps / 50) * 100, 100)}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Fallback to original compact mode for specific exercise */}
        {exercise && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {viewMode === 'friends' ? 'Friends' : 'Global'} Leaderboard
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  size="xs" 
                  variant={viewMode === 'all' ? 'default' : 'outline'} 
                  onClick={() => setViewMode('all')}
                  className="h-6 px-2 text-xs"
                >
                  All
                </Button>
                <Button 
                  size="xs" 
                  variant={viewMode === 'friends' ? 'default' : 'outline'} 
                  onClick={() => setViewMode('friends')}
                  className="h-6 px-2 text-xs"
                >
                  Friends
                </Button>
              </div>
            </div>
            <ExerciseLeaderboard
              exercise={exercise}
              data={getCurrentData(exercise)}
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
      {error && (
      <span className="ml-2 relative">
      <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
      </span>
      )}
      </CardTitle>
      <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
      <Button 
      size="sm" 
      variant={viewMode === 'all' ? 'default' : 'outline'} 
      onClick={() => setViewMode('all')}
      className="h-8 px-3 text-xs"
      >
      All
      </Button>
      <Button 
      size="sm" 
      variant={viewMode === 'friends' ? 'default' : 'outline'} 
      onClick={() => setViewMode('friends')}
      className="h-8 px-3 text-xs"
      >
      Friends
      </Button>
      </div>
      <Select value={chainFilterView} onValueChange={(v) => setChainFilterView(v as ChainFilter)}>
          <SelectTrigger className="w-24 h-8">
              <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Chains</SelectItem>
                 <SelectItem value="base">Base</SelectItem>
                 <SelectItem value="avalanche">Avalanche</SelectItem>
                 <SelectItem value="solana">Solana</SelectItem>
               </SelectContent>
             </Select>
             <RefreshButton size="sm" onClick={() => refetch()} />
           </div>
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
        {error && (
          <p className="text-xs text-red-500 text-center">
            Error: {error}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {/* Desktop: Side by side */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
          <ExerciseLeaderboard
            exercise="pull-ups"
            data={getCurrentData('pull-ups')}
            isLoading={isLoading}
            compact={false}
          />
          <ExerciseLeaderboard
            exercise="jumps"
            data={getCurrentData('jumps')}
            isLoading={isLoading}
            compact={false}
          />
        </div>

        {/* Mobile: Stacked */}
        <div className="lg:hidden space-y-4">
          <ExerciseLeaderboard
            exercise="pull-ups"
            data={getCurrentData('pull-ups')}
            isLoading={isLoading}
            compact={false}
          />
          <ExerciseLeaderboard
            exercise="jumps"
            data={getCurrentData('jumps')}
            isLoading={isLoading}
            compact={false}
          />
        </div>
        
        {/* Friend activity feed in social mode */}
        {viewMode === 'friends' && friendAddresses.length > 0 && (
          <div className="pt-3 border-t border-border/30">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Activity className="h-4 w-4" />
              Friend Activity
            </h3>
            <div className="text-xs text-muted-foreground">
              {friendAddresses.slice(0, 3).map(addr => (
                <div key={addr} className="py-1 flex items-center justify-between">
                  <span>{addr.substring(0, 6)}...{addr.substring(addr.length - 4)}</span>
                  <span className="text-green-500">Active now</span>
                </div>
              ))}
              {friendAddresses.length > 3 && (
                <div className="py-1 text-center text-muted-foreground">
                  +{friendAddresses.length - 3} more friends
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { Leaderboard };
export default Leaderboard;
