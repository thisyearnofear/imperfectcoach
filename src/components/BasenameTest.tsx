import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle, XCircle, Info } from "lucide-react";
import { useBasenameResolver } from "@/hooks/useBasenameResolver";
import { getCDPStatus } from "@/lib/cdp";

export const BasenameTest = () => {
  const [testAddress, setTestAddress] = useState("0x3D861566a24A6B747c6DdaC5c31ddf3d0AF3F3f1");
  const [resolving, setResolving] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const resolver = useBasenameResolver({
    cacheDuration: 1 * 60 * 1000, // 1 minute for testing
    enableCDP: true,
    enableThirdweb: true,
    batchSize: 1,
  });

  const cdpStatus = getCDPStatus();
  const stats = resolver.getCacheStats();

  // Test addresses with known basenames
  const knownAddresses = [
    { address: "0x3D861566a24A6B747c6DdaC5c31ddf3d0AF3F3f1", expected: "basedbaddy.base.eth" },
    { address: "0x4f96f50edb37a19216d87693e5dffe5ddbf7b6b8", expected: "coupondj.base.eth" },
    { address: "0x1234567890123456789012345678901234567890", expected: null }, // No basename
  ];

  const testSingleAddress = async (address: string) => {
    setResolving(true);
    const startTime = Date.now();

    try {
      const result = await resolver.resolveBasename(address);
      const endTime = Date.now();

      setResults(prev => [...prev, {
        address,
        result,
        duration: endTime - startTime,
        timestamp: new Date().toLocaleTimeString(),
        success: !!result,
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        address,
        result: null,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toLocaleTimeString(),
        success: false,
      }]);
    }

    setResolving(false);
  };

  const testAllKnownAddresses = async () => {
    setResults([]);
    for (const { address } of knownAddresses) {
      await testSingleAddress(address);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const clearResults = () => {
    setResults([]);
    resolver.clearCache();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Basename Resolution Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Configuration Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium">CDP Status</div>
            <div className="flex items-center gap-2 mt-1">
              {cdpStatus.configured ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                {cdpStatus.configured ? "Configured" : "Not Configured"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {cdpStatus.features.length} features available
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium">Web3.bio API</div>
            <div className="flex items-center gap-2 mt-1">
              {import.meta.env.VITE_WEB3BIO_API_KEY ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Info className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm">
                {import.meta.env.VITE_WEB3BIO_API_KEY ? "API Key Set" : "No API Key"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Enhanced rate limits
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium">Cache Stats</div>
            <div className="text-sm mt-1">
              {stats.cacheSize} entries • {stats.hitRate}% hit rate
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              CDP: {stats.cdpSuccesses} • Thirdweb: {stats.thirdwebSuccesses}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter address to test..."
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => testSingleAddress(testAddress)}
              disabled={resolving || !testAddress}
            >
              {resolving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Test
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={testAllKnownAddresses}
              disabled={resolving}
            >
              Test Known Addresses
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results & Cache
            </Button>
          </div>
        </div>

        {/* Known Test Addresses */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Known Test Addresses:</div>
          <div className="grid gap-2">
            {knownAddresses.map(({ address, expected }) => (
              <div key={address} className="flex items-center gap-2 text-xs">
                <code className="font-mono bg-muted px-2 py-1 rounded">
                  {address.slice(0, 10)}...{address.slice(-8)}
                </code>
                <span className="text-muted-foreground">→</span>
                <span className={expected ? "text-green-600" : "text-gray-500"}>
                  {expected || "No basename"}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => testSingleAddress(address)}
                  className="h-6 px-2"
                >
                  Test
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Test Results:</div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <code className="text-xs font-mono">
                        {result.address.slice(0, 10)}...{result.address.slice(-8)}
                      </code>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{result.duration}ms</span>
                      <span>{result.timestamp}</span>
                    </div>
                  </div>

                  {result.result && (
                    <div className="mt-2">
                      <Badge variant="default" className="text-xs">
                        {result.result}
                      </Badge>
                    </div>
                  )}

                  {result.error && (
                    <div className="mt-2 text-xs text-red-600">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Provider Status */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Enabled Providers: {stats.enabledProviders.join(", ")}</div>
          <div>
            Resolution Order:
            {stats.cdpConfigured ? " 1. CDP (Web3.bio, Coinbase, Base)" : ""}
            {" "}
            {stats.enabledProviders.includes("Thirdweb") ?
              `${stats.cdpConfigured ? "2" : "1"}. Thirdweb` : ""
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasenameTest;
