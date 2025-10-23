import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Network,
  AlertTriangle,
  Zap,
  Settings,
  CheckCircle,
} from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { getCDPStatus, getNetworkStatus, type CDPNetworkStatus } from "@/lib/cdp";
import { useUserBlockchain } from "@/hooks/useUserHooks";
import { cn } from "@/lib/utils";

interface StatusStripProps {
  variant?: "compact" | "full";
  showCDP?: boolean;
  showNetwork?: boolean;
  onFixAction?: () => void;
  className?: string;
}

const NETWORK_INFO = {
  8453: { name: "Base Mainnet", isCorrect: false },
  84532: { name: "Base Sepolia", isCorrect: true },
  1: { name: "Ethereum Mainnet", isCorrect: false },
} as const;

export function StatusStrip({
  variant = "compact",
  showCDP = true,
  showNetwork = true,
  onFixAction,
  className,
}: StatusStripProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchToBaseSepolia } = useUserBlockchain();
  
  const [cdpStatus, setCdpStatus] = useState(getCDPStatus());
  const [networkStatus, setNetworkStatus] = useState<CDPNetworkStatus>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const [network] = await Promise.all([
          getNetworkStatus(),
        ]);
        setNetworkStatus(network);
        setCdpStatus(getCDPStatus());
      } catch (error) {
        console.error("Error loading status:", error);
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isConnected) {
    return null;
  }

  const networkInfo = NETWORK_INFO[chainId as keyof typeof NETWORK_INFO] || {
    name: `Unknown (${chainId})`,
    isCorrect: false,
  };

  const hasIssues = !networkInfo.isCorrect;
  const needsAction = hasIssues;

  // Compact variant for inline display
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {/* CDP Status */}
        {showCDP && (
          <Badge
            variant={cdpStatus.configured ? "default" : "outline"}
            className="text-xs"
          >
            <Shield className="h-3 w-3 mr-1" />
            CDP {cdpStatus.configured ? "Active" : "Basic"}
          </Badge>
        )}

        {/* Network Status */}
        {showNetwork && (
          <Badge
            variant={networkInfo.isCorrect ? "default" : "destructive"}
            className="text-xs"
          >
            <Network className="h-3 w-3 mr-1" />
            {networkInfo.name}
          </Badge>
        )}

        {/* Network Congestion */}
        {showCDP && networkStatus && (
          <Badge
            variant={
              networkStatus.congestion === "low" ? "default" :
              networkStatus.congestion === "medium" ? "secondary" : "destructive"
            }
            className="text-xs"
          >
            {networkStatus.congestion?.toUpperCase()}
          </Badge>
        )}

        {/* Fix Action */}
        {needsAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onFixAction || switchToBaseSepolia}
            className="h-6 px-2 text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            Fix
          </Button>
        )}
      </div>
    );
  }

  // Full variant with detailed alert
  if (hasIssues) {
    return (
      <Alert className={cn("border-orange-200 bg-orange-50", className)}>
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                <Network className="h-4 w-4" />
                Wrong Network: {networkInfo.name}
              </div>
              <div className="text-xs mt-1">
                Switch to Base Sepolia to submit scores and access premium features
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onFixAction || switchToBaseSepolia}
              className="border-orange-300 text-orange-700 hover:bg-orange-100 flex-shrink-0"
            >
              <Zap className="h-4 w-4 mr-1" />
              Switch Network
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Success state - compact success indicator
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <span>All systems ready</span>
      {showCDP && cdpStatus.configured && (
        <Badge variant="outline" className="text-xs">
          <Shield className="h-3 w-3 mr-1" />
          CDP Enhanced
        </Badge>
      )}
    </div>
  );
}
