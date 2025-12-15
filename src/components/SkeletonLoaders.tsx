/**
 * Reusable skeleton loaders for async-loaded components
 * Following core principle: DRY (Single source of truth for loading states)
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton for a leaderboard entry row
 */
export const LeaderboardEntrySkeleton = () => (
  <div className="flex items-center justify-between px-4 py-3 gap-4">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {/* Rank */}
      <Skeleton className="h-6 w-6 rounded-full" />
      {/* Avatar */}
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      {/* Name */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    {/* Score badges */}
    <div className="flex items-center gap-2 shrink-0">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-16" />
    </div>
  </div>
);

/**
 * Skeleton for a full leaderboard list
 */
export const LeaderboardListSkeleton = ({ count = 10 }: { count?: number }) => (
  <div className="space-y-1">
    {Array.from({ length: count }).map((_, i) => (
      <LeaderboardEntrySkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton for wallet balance card
 */
export const BalanceCardSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-20" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-24" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for performance analytics card
 */
export const AnalyticsCardSkeleton = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  </div>
);

/**
 * Skeleton for stats grid
 */
export const StatsGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-2 p-3 rounded-lg border border-border">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-24" />
      </div>
    ))}
  </div>
);

/**
 * Skeleton for profile section
 */
export const ProfileSectionSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="flex items-start gap-4">
      <Skeleton className="h-16 w-16 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
  </div>
);

/**
 * Skeleton for data table
 */
export const DataTableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="border border-border rounded-lg overflow-hidden">
    {/* Header */}
    <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/50">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={`header-${i}`} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div key={rowIdx} className="flex items-center gap-2 p-3 border-b border-border last:border-0">
        {Array.from({ length: cols }).map((_, colIdx) => (
          <Skeleton key={`cell-${rowIdx}-${colIdx}`} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Skeleton for achievement card
 */
export const AchievementCardSkeleton = () => (
  <div className="space-y-3 p-4 border border-border rounded-lg">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-4 w-32" />
    </div>
  </div>
);

/**
 * Skeleton for achievement grid
 */
export const AchievementGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <AchievementCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton for chart/graph
 */
export const ChartSkeleton = ({ height = "h-64" }: { height?: string }) => (
  <div className={cn("rounded-lg border border-border bg-muted/30 p-4", height)}>
    <Skeleton className="w-full h-full" />
  </div>
);
