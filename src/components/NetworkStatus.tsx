import React, { useEffect, useState } from "react";
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
  AlertCircle,
  Clock,
} from "lucide-react";
import { useUserBlockchain } from "@/hooks/useUserHooks";
import { cn } from "@/lib/utils";
import { getNetworkConfig, isNetworkSupported, getAvailableSupportedNetworks } from "@/lib/config";
import { solanaWalletManager } from "@/lib/payments/solana-wallet-adapter";

interface NetworkStatusProps {
  variant?: "compact" | "full" | "alert";
  showSwitchButton?: boolean;
  className?: string;
}

export const NetworkStatus = ({
  variant = "compact",
  showSwitchButton = true,
  className,
}: NetworkStatusProps) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [solanaConnected, setSolanaConnected] = useState(false);

  // Monitor Solana wallet connection
  useEffect(() => {
    const checkSolana = () => {
      const state = solanaWalletManager.getState();
      setSolanaConnected(state.connected);
    };

    checkSolana();
    const interval = setInterval(checkSolana, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isConnected && !solanaConnected) {
    return null;
  }

  // Determine which network is active
  const isSolanaActive = solanaConnected && !isConnected;
  
  let displayInfo;
  let isSupported = true; // Default to true, will be updated for EVM
  
  if (isSolanaActive) {
    // Solana is the active network
    displayInfo = {
      name: "Solana Devnet",
      status: "supported" as const,
      features: ["agents", "payments"],
      description: "Solana devnet - agent services available",
    };
  } else {
    // EVM network is active
    const networkConfig = getNetworkConfig(chainId);
    isSupported = isNetworkSupported(chainId);
    
    displayInfo = networkConfig || {
      name: `Unknown Network (${chainId})`,
      status: "unsupported" as const,
      features: [] as string[],
      description: "Unsupported network. Switch to a supported testnet above.",
    };
  }

  // Compact variant for headers/toolbars
  if (variant === "compact") {
    const badgeVariant = displayInfo.status === "supported" ? "default" : displayInfo.status === "coming_soon" ? "secondary" : "destructive";
    const iconComponent = displayInfo.status === "supported" ? CheckCircle : displayInfo.status === "coming_soon" ? Clock : AlertTriangle;
    const Icon = iconComponent;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-2", className)}>
              <Badge
                variant={badgeVariant}
                className={cn(
                  "text-xs",
                  displayInfo.status === "supported" && "bg-green-100 text-green-800 border-green-200",
                  displayInfo.status === "coming_soon" && "bg-blue-100 text-blue-800 border-blue-200",
                  displayInfo.status === "unsupported" && "bg-red-100 text-red-800 border-red-200"
                )}
              >
                <Icon className="h-3 w-3 mr-1" />
                {displayInfo.name}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{displayInfo.description}</p>
            {"features" in displayInfo && displayInfo.features && displayInfo.features.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Features: {displayInfo.features.join(", ")}
              </p>
            )}
            {!isSupported && (
              <p className="text-xs font-medium text-orange-600 mt-1">
                Switch to a supported network in your wallet
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Alert variant for inline warnings
  if (variant === "alert") {
    if (displayInfo.status === "supported") return null;

    return (
      <Alert className={cn(
        displayInfo.status === "coming_soon" ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"
      )}>
        <AlertCircle className={cn(
          "h-4 w-4",
          displayInfo.status === "coming_soon" ? "text-blue-600" : "text-orange-600"
        )} />
        <AlertDescription className={cn(
          displayInfo.status === "coming_soon" ? "text-blue-800" : "text-orange-800"
        )}>
          <div className="space-y-2">
            <div>
              <span className="font-medium">{displayInfo.status === "coming_soon" ? "Coming Soon" : "Unsupported Network"}:</span>{" "}
              {displayInfo.name}
              <div className="text-xs mt-1">{displayInfo.description}</div>
            </div>
            {displayInfo.status === "unsupported" && (
              <div className="text-xs space-y-1">
                <p className="font-medium">Supported networks:</p>
                <ul className="list-disc list-inside">
                  {getAvailableSupportedNetworks().map(net => (
                    <li key={net.chainId}>{net.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Full variant for detailed display
  const getChainDocs = (chainId: number) => {
    switch (chainId) {
      case 84532:
        return { name: "Base Docs", url: "https://docs.base.org/" };
      case 43113:
      case 43114:
        return { name: "Avalanche Docs", url: "https://docs.avax.network/" };
      default:
        return null;
    }
  };

  const docs = getChainDocs(chainId);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Network className="h-5 w-5" />
          Network Status
          {displayInfo.status === "supported" && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          {displayInfo.status === "coming_soon" && (
            <Clock className="h-4 w-4 text-blue-600" />
          )}
          {displayInfo.status === "unsupported" && (
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Network */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{displayInfo.name}</div>
            <div className="text-sm text-muted-foreground">
              Chain ID: {chainId}
            </div>
          </div>
          <Badge
            className={cn(
              displayInfo.status === "supported" && "bg-green-100 text-green-800 border-green-200",
              displayInfo.status === "coming_soon" && "bg-blue-100 text-blue-800 border-blue-200",
              displayInfo.status === "unsupported" && "bg-orange-100 text-orange-800 border-orange-200"
            )}
          >
            {displayInfo.status === "supported" ? "✅ Supported" : displayInfo.status === "coming_soon" ? "⏱️ Coming Soon" : "⚠️ Unsupported"}
          </Badge>
        </div>

        {/* Network Description */}
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
          {displayInfo.description}
        </div>

        {/* Features */}
        {"features" in displayInfo && displayInfo.features && displayInfo.features.length > 0 && (
          <div className="text-sm space-y-2">
            <p className="font-medium">Available Features:</p>
            <div className="flex flex-wrap gap-1">
              {displayInfo.features.map(feature => (
                <Badge key={feature} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Network Selection */}
        {!isSupported && (
          <div className="space-y-3">
            <div className="text-sm space-y-2">
              <p className="font-medium">Supported Networks:</p>
              <div className="space-y-1">
                {getAvailableSupportedNetworks().map(net => (
                  <div key={net.chainId} className="text-xs p-2 bg-muted rounded flex justify-between items-center">
                    <span>{net.name}</span>
                    <span className="text-muted-foreground">{net.features.join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Instructions */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">To switch networks:</p>
              <p>1. Open your wallet settings</p>
              <p>2. Find "Networks" or "Switch Network"</p>
              <p>3. Select a supported network from above</p>
            </div>

            {/* External Resources */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open("https://chainlist.org/", "_blank")
                }
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Chainlist
              </Button>
              {docs && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(docs.url, "_blank")}
                  className="text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {docs.name}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Success State */}
        {displayInfo.status === "supported" && (
          <div className="text-center py-2">
            <div className="text-green-600 font-medium">
              🎉 Perfect! Network is supported
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Ready to use: {displayInfo.features?.join(", ")}
            </div>
          </div>
        )}

        {/* Coming Soon State */}
        {displayInfo.status === "coming_soon" && (
          <div className="text-center py-2">
            <div className="text-blue-600 font-medium">
              ⏱️ Mainnet support coming soon
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {displayInfo.description}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkStatus;
