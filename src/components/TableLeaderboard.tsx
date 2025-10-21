import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Trophy,
  Medal,
  Award,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
} from "lucide-react";
import { Exercise } from "@/lib/types";
import { useUserBlockchain } from "@/hooks/useUserHooks";
import { useBasename } from "@/hooks/useBasename";
import { SmartRefresh, RefreshButton } from "./SmartRefresh";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  address: string;
  username: string;
  pullups: number;
  jumps: number;
  timestamp: number;
  rank: number;
  totalScore: number;
}

type SortField = "rank" | "username" | "pullups" | "jumps" | "total" | "timestamp";
type SortDirection = "asc" | "desc";

interface TableLeaderboardProps {
  exercise?: Exercise;
  limit?: number;
  compact?: boolean;
}

// User display with basename resolution
const UserDisplay = ({ address }: { address: string }) => {
  const { basename, isLoading } = useBasename(address);
  const displayName =
    basename || `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <span className="truncate font-medium" title={address}>
      {isLoading ? (
        <span className="text-muted-foreground text-xs">Loading...</span>
      ) : (
        displayName
      )}
    </span>
  );
};

// Rank badge with medal icons
const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return (
      <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
        <Trophy className="h-3 w-3 mr-1" />
        1st
      </Badge>
    );
  }
  if (rank === 2) {
    return (
      <Badge variant="secondary" className="bg-gray-300 hover:bg-gray-400">
        <Medal className="h-3 w-3 mr-1" />
        2nd
      </Badge>
    );
  }
  if (rank === 3) {
    return (
      <Badge variant="secondary" className="bg-amber-600 hover:bg-amber-700 text-white">
        <Award className="h-3 w-3 mr-1" />
        3rd
      </Badge>
    );
  }
  return <Badge variant="outline">#{rank}</Badge>;
};

// Sortable column header
const SortableHeader = ({
  field,
  currentSort,
  currentDirection,
  onSort,
  children,
  className,
}: {
  field: SortField;
  currentSort: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
  className?: string;
}) => {
  const isActive = currentSort === field;
  
  return (
    <TableHead className={cn("cursor-pointer select-none", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 hover:bg-muted/50"
        onClick={() => onSort(field)}
      >
        {children}
        {isActive ? (
          currentDirection === "asc" ? (
            <ArrowUp className="ml-1 h-3 w-3" />
          ) : (
            <ArrowDown className="ml-1 h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
        )}
      </Button>
    </TableHead>
  );
};

// Format timestamp to relative time
const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
};

export const TableLeaderboard = ({
  exercise,
  limit = 50,
  compact = false,
}: TableLeaderboardProps) => {
  const { leaderboard, isLoading, pendingUpdates } = useUserBlockchain();
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = compact ? 10 : 50;

  // Process and sort leaderboard data
  const processedData = useMemo<LeaderboardEntry[]>(() => {
    const processed = leaderboard.map((score, index) => ({
      address: score.user,
      username: score.user,
      pullups: score.pullups,
      jumps: score.jumps,
      timestamp: score.timestamp,
      rank: index + 1,
      totalScore: score.pullups + score.jumps,
    }));

    // Apply exercise filter if specified
    let filtered = processed;
    if (exercise) {
      filtered = processed.filter((entry) =>
        exercise === "pull-ups" ? entry.pullups > 0 : entry.jumps > 0
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "rank":
          comparison = a.rank - b.rank;
          break;
        case "username":
          comparison = a.username.localeCompare(b.username);
          break;
        case "pullups":
          comparison = b.pullups - a.pullups; // Default desc for scores
          break;
        case "jumps":
          comparison = b.jumps - a.jumps; // Default desc for scores
          break;
        case "total":
          comparison = b.totalScore - a.totalScore; // Default desc for total
          break;
        case "timestamp":
          comparison = b.timestamp - a.timestamp; // Default desc (newest first)
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    // Re-assign ranks after sorting
    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [leaderboard, exercise, sortField, sortDirection]);

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      // New field: default to desc for scores, asc for others
      setSortField(field);
      setSortDirection(
        field === "rank" || field === "username" ? "asc" : "desc"
      );
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayData = processedData.slice(startIndex, endIndex);

  // Reset to page 1 when sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortField, sortDirection, exercise]);

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>🏆 Top Athletes</span>
            <RefreshButton size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Athlete</TableHead>
                <TableHead className="text-right">
                  {exercise === "pull-ups" ? "Pull-ups" : exercise === "jumps" ? "Jumps" : "Total"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 className="h-4 w-4 animate-spin inline" />
                  </TableCell>
                </TableRow>
              ) : displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No scores yet. Be the first!
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((entry) => (
                  <TableRow key={entry.address}>
                    <TableCell>
                      <RankBadge rank={entry.rank} />
                    </TableCell>
                    <TableCell>
                      <UserDisplay address={entry.address} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {exercise === "pull-ups"
                        ? entry.pullups
                        : exercise === "jumps"
                        ? entry.jumps
                        : entry.totalScore}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            🏆 Onchain Olympians
            {pendingUpdates && (
              <span className="relative">
                <span className="absolute top-0 right-0 h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
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
        {exercise && (
          <Badge variant="secondary" className="w-fit">
            {exercise} leaderboard
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader
                field="rank"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
                className="w-20"
              >
                Rank
              </SortableHeader>
              <SortableHeader
                field="username"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
              >
                Athlete
              </SortableHeader>
              {!exercise && (
                <>
                  <SortableHeader
                    field="pullups"
                    currentSort={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="text-right"
                  >
                    Pull-ups
                  </SortableHeader>
                  <SortableHeader
                    field="jumps"
                    currentSort={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="text-right"
                  >
                    Jumps
                  </SortableHeader>
                  <SortableHeader
                    field="total"
                    currentSort={sortField}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="text-right"
                  >
                    Total
                  </SortableHeader>
                </>
              )}
              {exercise && (
                <SortableHeader
                  field={exercise === "pull-ups" ? "pullups" : "jumps"}
                  currentSort={sortField}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  className="text-right"
                >
                  Score
                </SortableHeader>
              )}
              <SortableHeader
                field="timestamp"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={handleSort}
                className="text-right hidden md:table-cell"
              >
                Last Update
              </SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={exercise ? 4 : 6}
                  className="text-center py-12"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Loading leaderboard...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={exercise ? 4 : 6}
                  className="text-center py-12"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Trophy className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      No scores yet. Be the first to compete!
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((entry) => (
                <TableRow key={entry.address} className="hover:bg-muted/50">
                  <TableCell>
                    <RankBadge rank={entry.rank} />
                  </TableCell>
                  <TableCell>
                    <UserDisplay address={entry.address} />
                  </TableCell>
                  {!exercise && (
                    <>
                      <TableCell className="text-right font-semibold">
                        {entry.pullups}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {entry.jumps}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {entry.totalScore}
                      </TableCell>
                    </>
                  )}
                  {exercise && (
                    <TableCell className="text-right font-semibold">
                      {exercise === "pull-ups" ? entry.pullups : entry.jumps}
                    </TableCell>
                  )}
                  <TableCell className="text-right text-xs text-muted-foreground hidden md:table-cell">
                    {formatTimeAgo(entry.timestamp)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {/* Page numbers with ellipsis logic */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    // Show ellipsis
                    const showEllipsisBefore =
                      page === currentPage - 2 && currentPage > 3;
                    const showEllipsisAfter =
                      page === currentPage + 2 && currentPage < totalPages - 2;

                    if (showEllipsisBefore || showEllipsisAfter) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    if (!showPage) return null;

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            {/* Page info */}
            <div className="text-center mt-2 text-xs text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, processedData.length)}{" "}
              of {processedData.length} athletes
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TableLeaderboard;
