import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  RefreshCw,
  Clock,
  Wifi,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Zap,
  Eye,
} from "lucide-react";
import { useUserBlockchain } from "@/hooks/useUserHooks";
import { cn } from "@/lib/utils";

interface SmartRefreshProps {
  variant?: "minimal" | "detailed" | "badge" | "icon";
  size?: "sm" | "md" | "lg";
  showStaleness?: boolean;
  showLastRefresh?: boolean;
  className?: string;
}

const RefreshStatusIndicator = ({
  staleness,
  pendingUpdates,
  isRefreshing,
}: {
  staleness: number;
  pendingUpdates: boolean;
  isRefreshing: boolean;
}) => {
  if (isRefreshing) {
    return (
      <div className="flex items-center gap-1 text-blue-600">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span className="text-xs">Updating...</span>
      </div>
    );
  }

  if (pendingUpdates) {
    return (
      <div className="flex items-center gap-1 text-orange-600">
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs">Updates available</span>
      </div>
    );
  }

  if (staleness > 60) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">Data outdated</span>
      </div>
    );
  }

  if (staleness > 30) {
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <Clock className="h-3 w-3" />
        <span className="text-xs">Getting old</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-green-600">
      <CheckCircle className="h-3 w-3" />
      <span className="text-xs">Fresh</span>
    </div>
  );
};

const StalenessProgressBar = ({ staleness }: { staleness: number }) => {
  const getColor = () => {
    if (staleness > 60) return "bg-red-500";
    if (staleness > 30) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div
        className={cn("h-full transition-all duration-500", getColor())}
        style={{ width: `${Math.min(staleness, 100)}%` }}
      />
    </div>
  );
};

const DetailedRefreshPanel = () => {
  const {
    isRefreshing,
    staleness,
    pendingUpdates,
    lastRefresh,
    lastUserRefresh,
    refetch,
  } = useUserBlockchain();

  const formatTime = (date: Date | undefined) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) return `${minutes}m ${seconds}s ago`;
    return `${seconds}s ago`;
  };

  const getRefreshSuggestion = () => {
    if (staleness > 80) return "Data is very outdated - refresh recommended";
    if (staleness > 60) return "Consider refreshing for latest data";
    if (staleness > 30) return "Data is getting old";
    return "Data is fresh and up-to-date";
  };

  const getRefreshUrgency = (): "low" | "medium" | "high" => {
    if (staleness > 60) return "high";
    if (staleness > 30) return "medium";
    return "low";
  };

  const urgency = getRefreshUrgency();

  return (
    <div className="space-y-3 p-1">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Data Freshness</span>
          <Badge
            variant={
              urgency === "high"
                ? "destructive"
                : urgency === "medium"
                  ? "secondary"
                  : "default"
            }
            className="text-xs"
          >
            {Math.round(100 - staleness)}% fresh
          </Badge>
        </div>
        <StalenessProgressBar staleness={staleness} />
        <p className="text-xs text-muted-foreground">
          {getRefreshSuggestion()}
        </p>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Last auto-update:</span>
          <span>{formatTime(lastRefresh)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Last manual refresh:</span>
          <span>{formatTime(lastUserRefresh)}</span>
        </div>
      </div>

      <Button
        onClick={refetch}
        disabled={isRefreshing}
        size="sm"
        className={cn(
          "w-full",
          urgency === "high" && "bg-red-600 hover:bg-red-700",
          urgency === "medium" && "bg-orange-600 hover:bg-orange-700",
        )}
      >
        {isRefreshing ? (
          <>
            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
            Refreshing...
          </>
        ) : (
          <>
            <Zap className="h-3 w-3 mr-2" />
            Refresh Data
          </>
        )}
      </Button>

      {pendingUpdates && (
        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">New activity detected</span>
          </div>
          <p className="mt-1">There may be new scores on the leaderboard</p>
        </div>
      )}
    </div>
  );
};

export const SmartRefresh = ({
  variant = "detailed",
  size = "md",
  showStaleness = true,
  showLastRefresh = true,
  className,
}: SmartRefreshProps) => {
  const { isRefreshing, staleness, pendingUpdates, lastRefresh, refetch } =
    useUserBlockchain();

  const [showTooltip, setShowTooltip] = useState(false);

  // Auto-hide tooltip after successful refresh
  useEffect(() => {
    if (!isRefreshing && showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isRefreshing, showTooltip]);

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const getButtonVariant = () => {
    if (pendingUpdates || staleness > 60) return "default";
    if (staleness > 30) return "secondary";
    return "ghost";
  };

  const getRefreshIcon = () => {
    if (isRefreshing)
      return (
        <RefreshCw className={cn(iconSizeClasses[size], "animate-spin")} />
      );
    if (pendingUpdates) return <TrendingUp className={iconSizeClasses[size]} />;
    if (staleness > 60)
      return <AlertCircle className={iconSizeClasses[size]} />;
    return <RefreshCw className={iconSizeClasses[size]} />;
  };

  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={getButtonVariant()}
              size="sm"
              onClick={refetch}
              disabled={isRefreshing}
              className={cn(sizeClasses[size], "p-0", className)}
            >
              {getRefreshIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">
                {isRefreshing ? "Refreshing..." : "Refresh leaderboard"}
              </p>
              {!isRefreshing && (
                <p className="text-xs text-muted-foreground">
                  Data is {Math.round(100 - staleness)}% fresh
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "badge") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={pendingUpdates ? "default" : "secondary"}
              className={cn("cursor-pointer hover:bg-secondary/80", className)}
              onClick={refetch}
            >
              {getRefreshIcon()}
              <span className="ml-1">
                {isRefreshing
                  ? "Updating"
                  : `${Math.round(100 - staleness)}% fresh`}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to refresh data</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant={getButtonVariant()}
          size="sm"
          onClick={refetch}
          disabled={isRefreshing}
        >
          {getRefreshIcon()}
          {size !== "sm" && (
            <span className="ml-2">
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </span>
          )}
        </Button>
        {showStaleness && !isRefreshing && (
          <Badge variant="outline" className="text-xs">
            {Math.round(100 - staleness)}% fresh
          </Badge>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={getButtonVariant()} size="sm" className="relative">
            {getRefreshIcon()}
            <span className="ml-2">
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </span>
            {(pendingUpdates || staleness > 60) && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-orange-500 rounded-full" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" side="bottom" align="end">
          <DetailedRefreshPanel />
        </PopoverContent>
      </Popover>

      {showStaleness && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <RefreshStatusIndicator
            staleness={staleness}
            pendingUpdates={pendingUpdates}
            isRefreshing={isRefreshing}
          />
        </div>
      )}

      {showLastRefresh && lastRefresh && !isRefreshing && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs cursor-help">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(lastRefresh).toLocaleTimeString()}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last updated: {lastRefresh.toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

// Convenience components
export const RefreshButton = (props: Omit<SmartRefreshProps, "variant">) => (
  <SmartRefresh {...props} variant="icon" />
);

export const RefreshBadge = (props: Omit<SmartRefreshProps, "variant">) => (
  <SmartRefresh {...props} variant="badge" />
);

export const MinimalRefresh = (props: Omit<SmartRefreshProps, "variant">) => (
  <SmartRefresh {...props} variant="minimal" />
);

// Hook for programmatic refresh with UX feedback
export const useSmartRefresh = () => {
  const { refetch, isRefreshing, staleness, pendingUpdates } =
    useUserBlockchain();

  const refreshWithFeedback = async (showSuccessToast = true) => {
    if (isRefreshing) return;

    try {
      await refetch();
      if (showSuccessToast) {
        // Toast is handled in the context
      }
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  const shouldSuggestRefresh = staleness > 60 || pendingUpdates;
  const refreshUrgency =
    staleness > 80 ? "high" : staleness > 40 ? "medium" : "low";

  return {
    refreshWithFeedback,
    isRefreshing,
    shouldSuggestRefresh,
    refreshUrgency,
    staleness: Math.round(staleness),
    freshness: Math.round(100 - staleness),
  };
};
