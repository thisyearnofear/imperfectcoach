import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  Shield,
  Activity,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  getCDPStatus,
  getNetworkStatus,
  getTransactionHistory,
  type CDPNetworkStatus,
  type TransactionMetadata,
} from "@/lib/cdp";

interface CDPStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const CDPStatus = ({ showDetails = false, compact = false }: CDPStatusProps) => {
  const [cdpStatus, setCdpStatus] = useState(getCDPStatus());
  const [networkStatus, setNetworkStatus] = useState<CDPNetworkStatus>(null);
  const [txHistory, setTxHistory] = useState<TransactionMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [network, transactions] = await Promise.all([
          getNetworkStatus(),
          Promise.resolve(getTransactionHistory()),
        ]);

        setNetworkStatus(network);
        setTxHistory(transactions);
        setCdpStatus(getCDPStatus());
      } catch (error) {
        console.error("Error loading CDP data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant={cdpStatus.configured ? "default" : "outline"}
          className="text-xs"
        >
          <Shield className="h-3 w-3 mr-1" />
          CDP {cdpStatus.configured ? "Active" : "Basic"}
        </Badge>
        {networkStatus && (
          <Badge
            variant={
              networkStatus.congestion === "low" ? "default" :
              networkStatus.congestion === "medium" ? "secondary" : "destructive"
            }
            className="text-xs"
          >
            <Activity className="h-3 w-3 mr-1" />
            {networkStatus.networkName}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Coinbase Developer Platform Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {cdpStatus.configured ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            )}
            <span className="font-medium">
              {cdpStatus.configured ? "Configured" : "Basic Mode"}
            </span>
          </div>
          <Badge variant={cdpStatus.configured ? "default" : "outline"}>
            {cdpStatus.features.length} Features
          </Badge>
        </div>

        {/* Available Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Available Features
          </h4>
          <div className="flex flex-wrap gap-2">
            {cdpStatus.features.map((feature) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Network Status */}
        {networkStatus && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Network Status
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Network:</span>
                <span className="ml-2 font-medium">{networkStatus.networkName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Gas Price:</span>
                <span className="ml-2 font-medium">{networkStatus.gasPrice}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Congestion:</span>
                <Badge
                  variant={
                    networkStatus.congestion === "low" ? "default" :
                    networkStatus.congestion === "medium" ? "secondary" : "destructive"
                  }
                  className="ml-2 text-xs"
                >
                  {networkStatus.congestion?.toUpperCase()}
                </Badge>
              </div>
            </div>
            {networkStatus.recommendation && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {networkStatus.recommendation}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Recent Transactions */}
        {showDetails && txHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Recent Transactions
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {txHistory.slice(0, 5).map((tx) => (
                <div
                  key={tx.hash}
                  className="p-2 bg-muted/30 rounded space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          tx.status === "confirmed" ? "default" :
                          tx.status === "failed" ? "destructive" : "secondary"
                        }
                        className="text-xs"
                      >
                        {tx.status}
                      </Badge>
                      {tx.type && (
                        <Badge variant="outline" className="text-xs">
                          {tx.type}
                        </Badge>
                      )}
                      <span className="text-xs font-mono">
                        {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {(tx.amount || tx.description) && (
                    <div className="flex justify-between items-center text-xs">
                      {tx.description && (
                        <span className="text-muted-foreground">{tx.description}</span>
                      )}
                      {tx.amount && tx.currency && (
                        <span className="font-medium">{tx.amount} {tx.currency}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configuration Help */}
        {!cdpStatus.configured && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <div className="space-y-2">
                <p>Configure CDP credentials to unlock enhanced features:</p>
                <ul className="list-disc list-inside text-xs space-y-1 ml-2">
                  <li>Enhanced transaction analytics</li>
                  <li>Better error reporting</li>
                  <li>Network insights</li>
                  <li>Priority support</li>
                </ul>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => window.open("https://portal.cdp.coinbase.com/", "_blank")}
                >
                  Get CDP Credentials <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-muted-foreground">Loading CDP status...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
