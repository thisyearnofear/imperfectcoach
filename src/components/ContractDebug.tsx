import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReadContract, useAccount } from "wagmi";
import { getContractConfig } from "@/lib/contracts";
import { CheckCircle, XCircle, AlertCircle, Activity } from "lucide-react";

export const ContractDebug = () => {
  const { isConnected, chain } = useAccount();
  const [manualTest, setManualTest] = useState<any>(null);
  const contractConfig = getContractConfig();

  // Test basic contract functions
  const { data: totalUsers, isLoading: loadingUsers, error: usersError } = useReadContract({
    ...contractConfig,
    functionName: "getTotalUsers",
    chainId: 84532,
  });

  const { data: leaderboard, isLoading: loadingLeaderboard, error: leaderboardError } = useReadContract({
    ...contractConfig,
    functionName: "getLeaderboard",
    chainId: 84532,
  });

  const { data: isBaseSepolia, isLoading: loadingChain, error: chainError } = useReadContract({
    ...contractConfig,
    functionName: "isBaseSepolia",
    chainId: 84532,
  });

  const testDirectRPC = async () => {
    setManualTest({ loading: true });
    try {
      const rpcUrl = import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

      // Test 1: Check chain ID
      const chainResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
        }),
      });
      const chainData = await chainResponse.json();

      // Test 2: Check contract code
      const codeResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 2,
          jsonrpc: "2.0",
          method: "eth_getCode",
          params: [contractConfig.address, "latest"],
        }),
      });
      const codeData = await codeResponse.json();

      // Test 3: Try contract call
      const callResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: 3,
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: contractConfig.address,
              data: "0x5aa6e675", // getTotalUsers() selector
            },
            "latest",
          ],
        }),
      });
      const callData = await callResponse.json();

      setManualTest({
        loading: false,
        chainId: parseInt(chainData.result, 16),
        hasCode: codeData.result && codeData.result !== "0x",
        codeLength: codeData.result ? codeData.result.length : 0,
        contractCall: callData.result,
        totalUsersFromCall: callData.result ? parseInt(callData.result, 16) : null,
        errors: [chainData.error, codeData.error, callData.error].filter(Boolean),
      });
    } catch (error) {
      setManualTest({
        loading: false,
        error: error.message,
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Contract Debug - Base Sepolia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium">Wallet Status</div>
            <div className="flex items-center gap-2 mt-1">
              {isConnected ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            {chain && (
              <div className="text-xs text-muted-foreground mt-1">
                Chain: {chain.name} ({chain.id})
              </div>
            )}
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium">Contract Address</div>
            <div className="text-xs font-mono mt-1 break-all">
              {contractConfig.address}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Base Sepolia (84532)
            </div>
          </div>
        </div>

        {/* Wagmi Contract Reads */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Wagmi Contract Reads</h4>

          <div className="grid gap-3">
            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <span className="text-sm">getTotalUsers()</span>
              <div className="flex items-center gap-2">
                {loadingUsers ? (
                  <Badge variant="secondary">Loading...</Badge>
                ) : usersError ? (
                  <Badge variant="destructive">Error</Badge>
                ) : (
                  <Badge variant="default">{String(totalUsers || 0)} users</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <span className="text-sm">getLeaderboard()</span>
              <div className="flex items-center gap-2">
                {loadingLeaderboard ? (
                  <Badge variant="secondary">Loading...</Badge>
                ) : leaderboardError ? (
                  <Badge variant="destructive">Error</Badge>
                ) : (
                  <Badge variant="default">{Array.isArray(leaderboard) ? leaderboard.length : 0} entries</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
              <span className="text-sm">isBaseSepolia()</span>
              <div className="flex items-center gap-2">
                {loadingChain ? (
                  <Badge variant="secondary">Loading...</Badge>
                ) : chainError ? (
                  <Badge variant="destructive">Error</Badge>
                ) : (
                  <Badge variant={isBaseSepolia ? "default" : "destructive"}>
                    {String(isBaseSepolia)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Details */}
        {(usersError || leaderboardError || chainError) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-600">Errors</h4>
            <div className="space-y-1 text-xs">
              {usersError && <div className="text-red-600">getTotalUsers: {usersError.message}</div>}
              {leaderboardError && <div className="text-red-600">getLeaderboard: {leaderboardError.message}</div>}
              {chainError && <div className="text-red-600">isBaseSepolia: {chainError.message}</div>}
            </div>
          </div>
        )}

        {/* Manual RPC Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Direct RPC Test</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={testDirectRPC}
              disabled={manualTest?.loading}
            >
              {manualTest?.loading ? "Testing..." : "Test RPC"}
            </Button>
          </div>

          {manualTest && !manualTest.loading && (
            <div className="p-3 bg-muted/30 rounded-lg space-y-2">
              {manualTest.error ? (
                <div className="text-red-600 text-sm">Error: {manualTest.error}</div>
              ) : (
                <div className="space-y-1 text-xs">
                  <div>Chain ID: {manualTest.chainId} {manualTest.chainId === 84532 ? "✅" : "❌"}</div>
                  <div>Contract Code: {manualTest.hasCode ? "✅ Found" : "❌ Not found"}</div>
                  <div>Code Length: {manualTest.codeLength} bytes</div>
                  <div>Total Users Call: {manualTest.totalUsersFromCall ?? "Failed"}</div>
                  {manualTest.errors.length > 0 && (
                    <div className="text-red-600">RPC Errors: {manualTest.errors.length}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Environment Info */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Environment</h4>
          <div className="text-xs space-y-1">
            <div>Custom RPC: {import.meta.env.VITE_BASE_SEPOLIA_RPC_URL ? "✅ Set" : "❌ Using default"}</div>
            <div>RPC URL: {import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://sepolia.basescan.org/address/${contractConfig.address}`, "_blank")}
          >
            View on BaseScan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => console.log("Contract Config:", contractConfig)}
          >
            Log Config
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractDebug;
