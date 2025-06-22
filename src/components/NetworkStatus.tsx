import React from "react";
import { useAccount, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Network,
  AlertTriangle,
  CheckCircle,
  Zap,
  ExternalLink,
} from "lucide-react";
import { useUserBlockchain } from "@/hooks/useUserHooks";
import { cn } from "@/lib/utils";

interface NetworkStatusProps {
  variant?: "compact" | "full" | "alert";
  showSwitchButton?: boolean;
  className?: string;
}

const NETWORK_INFO = {
  8453: {
    name: "Base Mainnet",
    color: "blue",
    status: "wrong" as const,
    description: "Production network - switch to testnet for this app",
  },
  84532: {
    name: "Base Sepolia",
    color: "green",
    status: "correct" as const,
    description: "Testnet - perfect for testing and development",
  },
  1: {
    name: "Ethereum Mainnet",
    color: "gray",
    status: "wrong" as const,
    description: "Ethereum mainnet - switch to Base Sepolia",
  },
} as const;

export const NetworkStatus = ({
  variant = "compact",
  showSwitchButton = true,
  className,
}: NetworkStatusProps) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchToBaseSepolia } = useUserBlockchain();

  if (!isConnected) {
    return null;
  }

  const networkInfo = NETWORK_INFO[chainId as keyof typeof NETWORK_INFO] || {
    name: `Unknown Network (${chainId})`,
    color: "gray",
    status: "wrong" as const,
    description: "Unknown network - please switch to Base Sepolia",
  };

  const isCorrectNetwork = networkInfo.status === "correct";

  // Compact variant for headers/toolbars
  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-2", className)}>
              <Badge
                variant={isCorrectNetwork ? "default" : "destructive"}
                className="text-xs"
              >
                <Network className="h-3 w-3 mr-1" />
                {networkInfo.name}
              </Badge>
              {!isCorrectNetwork && showSwitchButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchToBaseSepolia}
                  className="h-6 px-2 text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Switch
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{networkInfo.description}</p>
            {!isCorrectNetwork && (
              <p className="text-xs font-medium text-orange-600 mt-1">
                Click "Switch" to change networks
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Alert variant for inline warnings
  if (variant === "alert") {
    if (isCorrectNetwork) return null;

    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Wrong Network:</span>{" "}
              {networkInfo.name}
              <div className="text-xs mt-1">{networkInfo.description}</div>
            </div>
            {showSwitchButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchToBaseSepolia}
                className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Zap className="h-4 w-4 mr-1" />
                Switch to Base Sepolia
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Full variant for detailed display
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Network className="h-5 w-5" />
          Network Status
          {isCorrectNetwork ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Network */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{networkInfo.name}</div>
            <div className="text-sm text-muted-foreground">
              Chain ID: {chainId}
            </div>
          </div>
          <Badge
            variant={isCorrectNetwork ? "default" : "destructive"}
            className={cn(
              isCorrectNetwork
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-orange-100 text-orange-800 border-orange-200"
            )}
          >
            {isCorrectNetwork ? "✅ Correct" : "⚠️ Wrong Network"}
          </Badge>
        </div>

        {/* Network Description */}
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
          {networkInfo.description}
        </div>

        {/* Actions */}
        {!isCorrectNetwork && (
          <div className="space-y-3">
            {showSwitchButton && (
              <Button
                onClick={switchToBaseSepolia}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Switch to Base Sepolia
              </Button>
            )}

            {/* Manual Instructions */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Manual switching:</p>
              <p>1. Open your wallet settings</p>
              <p>2. Find "Networks" or "Switch Network"</p>
              <p>3. Select "Base Sepolia" from the list</p>
            </div>

            {/* External Resources */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open("https://chainlist.org/chain/84532", "_blank")
                }
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Chainlist
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open("https://docs.base.org/", "_blank")
                }
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Base Docs
              </Button>
            </div>
          </div>
        )}

        {/* Success State */}
        {isCorrectNetwork && (
          <div className="text-center py-2">
            <div className="text-green-600 font-medium">
              🎉 Perfect! You're on the right network
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Ready to submit scores to the blockchain
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkStatus;
