import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  resolveL2Name,
  BASENAME_RESOLVER_ADDRESS,
} from "thirdweb/extensions/ens";
import { createThirdwebClient } from "thirdweb";
import { base } from "thirdweb/chains";
import { getCDPStatus } from "@/lib/cdp";

// Thirdweb client
const client = createThirdwebClient({
  clientId:
    import.meta.env.VITE_THIRDWEB_CLIENT_ID ||
    "cd2fc16a6b59aa67ccaa3c76eaa421f3",
});

interface BasenameCache {
  [address: string]: {
    basename: string | null;
    timestamp: number;
    attempts: number;
  };
}

interface BasenameResolverOptions {
  cacheDuration?: number; // in milliseconds
  maxRetries?: number;
  batchSize?: number;
  enableCDP?: boolean;
  enableThirdweb?: boolean;
}

const DEFAULT_OPTIONS: Required<BasenameResolverOptions> = {
  cacheDuration: 10 * 60 * 1000, // 10 minutes for basenames
  maxRetries: 3,
  batchSize: 3, // Smaller batches to be respectful to APIs
  enableCDP: true,
  enableThirdweb: true,
};

// CDP-based basename resolution using multiple methods
const resolveCDPBasename = async (address: string): Promise<string | null> => {
  try {
    // Check if we have CDP credentials
    const projectId = import.meta.env.VITE_COINBASE_PROJECT_ID;
    const apiKeyId = import.meta.env.VITE_COINBASE_API_KEY_ID;
    const clientApiKey = import.meta.env.VITE_COINBASE_CLIENT_API_KEY;
    const apiKeySecret = import.meta.env.VITE_COINBASE_API_KEY_SECRET;
    const web3bioApiKey = import.meta.env.VITE_WEB3BIO_API_KEY;

    if (!projectId || !apiKeyId || !clientApiKey || !apiKeySecret) {
      console.log(
        "📋 CDP credentials not fully configured, trying Web3.bio...",
      );
    }

    // Method 1: Web3.bio API with optional API key
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "ImperfectCoach/1.0",
      };

      // Add API key if available for better rate limits
      if (web3bioApiKey) {
        headers["Authorization"] = `Bearer ${web3bioApiKey}`;
      }

      const web3bioResponse = await fetch(
        `https://api.web3.bio/profile/${address}`,
        { headers },
      );

      if (web3bioResponse.ok) {
        const web3bioData = await web3bioResponse.json();

        // Check for Base nameservice (.base.eth)
        if (web3bioData?.name && web3bioData.name.endsWith(".base.eth")) {
          console.log(
            `✅ CDP (Web3.bio) basename resolved: ${address} → ${web3bioData.name}`,
          );
          return web3bioData.name;
        }

        // Check ENS domains array for basename
        if (web3bioData?.domains) {
          const baseDomain = web3bioData.domains.find(
            (domain: any) => domain.name && domain.name.endsWith(".base.eth"),
          );
          if (baseDomain) {
            console.log(
              `✅ CDP (Web3.bio domains) basename resolved: ${address} → ${baseDomain.name}`,
            );
            return baseDomain.name;
          }
        }
      }
    } catch (error) {
      console.warn("Web3.bio API basename resolution failed:", error);
    }

    // Method 2: Try Coinbase's public ENS resolver API
    try {
      const coinbaseResponse = await fetch(
        `https://resolver-api.coinbase.com/v1/reverse-resolve/${address}`,
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "ImperfectCoach/1.0",
          },
        },
      );

      if (coinbaseResponse.ok) {
        const coinbaseData = await coinbaseResponse.json();
        if (coinbaseData?.name && coinbaseData.name.endsWith(".base.eth")) {
          console.log(
            `✅ CDP (Coinbase Resolver) basename resolved: ${address} → ${coinbaseData.name}`,
          );
          return coinbaseData.name;
        }
      }
    } catch (error) {
      console.warn("Coinbase resolver API failed:", error);
    }

    // Method 3: Base's official nameservice API
    try {
      const baseResponse = await fetch(
        `https://base.org/api/v1/name/${address}`,
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "ImperfectCoach/1.0",
          },
        },
      );

      if (baseResponse.ok) {
        const baseData = await baseResponse.json();
        if (baseData?.name) {
          console.log(
            `✅ CDP (Base API) basename resolved: ${address} → ${baseData.name}`,
          );
          return baseData.name;
        }
      }
    } catch (error) {
      console.warn("Base API basename resolution failed:", error);
    }

    // Method 4: Use configured CDP features for future enhancement
    const cdpStatus = getCDPStatus();
    if (cdpStatus.configured) {
      console.log(`🔍 CDP configured but no basename found for ${address}`);
    }

    return null;
  } catch (error) {
    console.warn("CDP basename resolution failed:", error);
    return null;
  }
};

// Thirdweb-based basename resolution
const resolveThirdwebBasename = async (
  address: string,
): Promise<string | null> => {
  try {
    const name = await resolveL2Name({
      client,
      address: address as `0x${string}`,
      resolverAddress: BASENAME_RESOLVER_ADDRESS,
      resolverChain: base,
    });

    if (name && name.length > 0) {
      console.log(`✅ Thirdweb basename resolved: ${address} → ${name}`);
      return name;
    }

    return null;
  } catch (error) {
    console.warn(
      `⚠️ Thirdweb basename resolution failed for ${address}:`,
      error,
    );
    return null;
  }
};

// Enhanced basename resolver hook
export const useBasenameResolver = (options: BasenameResolverOptions = {}) => {
  const config = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [
      options.cacheDuration,
      options.maxRetries,
      options.batchSize,
      options.enableCDP,
      options.enableThirdweb,
    ],
  );
  const [cache, setCache] = useState<BasenameCache>({});
  const [isResolving, setIsResolving] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    cacheHits: 0,
    cdpSuccesses: 0,
    thirdwebSuccesses: 0,
    failures: 0,
    lastUpdate: Date.now(),
  });

  // Refs for managing async operations
  const resolutionQueue = useRef<Set<string>>(new Set());
  const abortController = useRef<AbortController | null>(null);
  const lastBatchTime = useRef<number>(0);
  const preloadTimeout = useRef<NodeJS.Timeout | null>(null);

  // Circuit breaker to prevent excessive calls
  const circuitBreaker = useRef({
    consecutiveCalls: 0,
    lastCallTime: 0,
    isOpen: false,
    openUntil: 0,
  });

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const storedCache = localStorage.getItem("basename-cache");
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        // Filter out expired entries
        const now = Date.now();
        const validCache: BasenameCache = {};

        Object.entries(parsedCache).forEach(
          ([address, data]: [string, BasenameCache[string]]) => {
            if (data.timestamp && now - data.timestamp < config.cacheDuration) {
              validCache[address] = data;
            }
          },
        );

        setCache(validCache);
        console.log(
          `📋 Loaded ${Object.keys(validCache).length} basename entries from cache`,
        );

        // Log CDP and Web3.bio configuration status
        const cdpStatus = getCDPStatus();
        const web3bioKey = import.meta.env.VITE_WEB3BIO_API_KEY;
        console.log("🔧 Basename Resolution Config:", {
          cdp: cdpStatus.configured,
          web3bio: !!web3bioKey,
          thirdweb: true,
        });
      }
    } catch (error) {
      console.warn("Failed to load basename cache:", error);
    }
  }, [config.cacheDuration]);

  // Save cache to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("basename-cache", JSON.stringify(cache));
    } catch (error) {
      console.warn("Failed to save basename cache:", error);
    }
  }, [cache]);

  // Check if address is cached and valid
  const getCachedBasename = useCallback(
    (address: string): string | null => {
      const normalized = address.toLowerCase();
      const cached = cache[normalized];

      if (!cached) return null;

      const isExpired = Date.now() - cached.timestamp > config.cacheDuration;
      const hasMaxRetries = cached.attempts >= config.maxRetries;

      if (isExpired && !hasMaxRetries) {
        // Cache expired but we can retry
        return null;
      }

      setStats((prev) => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
      return cached.basename;
    },
    [cache, config.cacheDuration, config.maxRetries],
  );

  // Update cache with new result
  const updateCache = useCallback(
    (address: string, basename: string | null, success: boolean) => {
      const normalized = address.toLowerCase();

      setCache((prev) => ({
        ...prev,
        [normalized]: {
          basename,
          timestamp: Date.now(),
          attempts: (prev[normalized]?.attempts || 0) + 1,
        },
      }));

      setStats((prev) => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        cdpSuccesses:
          success && basename && config.enableCDP
            ? prev.cdpSuccesses + 1
            : prev.cdpSuccesses,
        thirdwebSuccesses:
          success && basename && config.enableThirdweb
            ? prev.thirdwebSuccesses + 1
            : prev.thirdwebSuccesses,
        failures: !success ? prev.failures + 1 : prev.failures,
        lastUpdate: Date.now(),
      }));
    },
    [],
  );

  // Resolve single basename with fallbacks
  const resolveSingleBasename = useCallback(
    async (address: string): Promise<string | null> => {
      const normalized = address.toLowerCase();

      // Check cache first
      const cached = getCachedBasename(normalized);
      if (cached !== null) {
        return cached;
      }

      // Skip if already in queue
      if (resolutionQueue.current.has(normalized)) {
        return null;
      }

      resolutionQueue.current.add(normalized);

      try {
        let basename: string | null = null;

        // Try CDP first (if enabled and configured)
        if (config.enableCDP) {
          basename = await resolveCDPBasename(normalized);
          if (basename) {
            updateCache(normalized, basename, true);
            resolutionQueue.current.delete(normalized);
            return basename;
          }
        }

        // Fallback to Thirdweb (if enabled)
        if (config.enableThirdweb) {
          basename = await resolveThirdwebBasename(normalized);
          if (basename) {
            updateCache(normalized, basename, true);
            resolutionQueue.current.delete(normalized);
            return basename;
          }
        }

        // No basename found, cache the null result
        updateCache(normalized, null, false);
        resolutionQueue.current.delete(normalized);
        return null;
      } catch (error) {
        console.error(`Error resolving basename for ${address}:`, error);
        updateCache(normalized, null, false);
        resolutionQueue.current.delete(normalized);
        return null;
      }
    },
    [config.enableCDP, config.enableThirdweb, getCachedBasename, updateCache],
  );

  // Resolve multiple basenames in batches
  const resolveBasenames = useCallback(
    async (
      addresses: string[],
    ): Promise<{ [address: string]: string | null }> => {
      if (addresses.length === 0) return {};

      setIsResolving(true);

      // Cancel any existing resolution
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      const results: { [address: string]: string | null } = {};
      const uniqueAddresses = [
        ...new Set(addresses.map((addr) => addr.toLowerCase())),
      ];

      try {
        // Process in batches to avoid overwhelming the network
        for (let i = 0; i < uniqueAddresses.length; i += config.batchSize) {
          const batch = uniqueAddresses.slice(i, i + config.batchSize);

          // Check if operation was cancelled
          if (abortController.current?.signal.aborted) {
            break;
          }

          // Process batch concurrently
          const batchPromises = batch.map(async (address) => {
            const basename = await resolveSingleBasename(address);
            return { address, basename };
          });

          const batchResults = await Promise.allSettled(batchPromises);

          batchResults.forEach((result) => {
            if (result.status === "fulfilled") {
              results[result.value.address] = result.value.basename;
            }
          });

          // Small delay between batches to be respectful to APIs
          if (i + config.batchSize < uniqueAddresses.length) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
      } catch (error) {
        console.error("Error in batch basename resolution:", error);
      } finally {
        setIsResolving(false);
      }

      return results;
    },
    [config.batchSize, resolveSingleBasename],
  );

  // Get display name for an address (basename or formatted address)
  const getDisplayName = useCallback(
    (address: string): string => {
      const cached = getCachedBasename(address.toLowerCase());

      if (cached) {
        return cached;
      }

      // Return formatted address as fallback
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },
    [getCachedBasename],
  );

  // Preload basenames for a list of addresses with circuit breaker and rate limiting
  const preloadBasenames = useCallback(
    (addresses: string[]) => {
      const now = Date.now();

      // Circuit breaker logic
      if (
        circuitBreaker.current.isOpen &&
        now < circuitBreaker.current.openUntil
      ) {
        console.log("🚫 Circuit breaker is open, skipping resolution");
        return;
      }

      // Reset circuit breaker if enough time has passed
      if (
        circuitBreaker.current.isOpen &&
        now >= circuitBreaker.current.openUntil
      ) {
        circuitBreaker.current.isOpen = false;
        circuitBreaker.current.consecutiveCalls = 0;
        console.log("✅ Circuit breaker reset");
      }

      // Check for rapid consecutive calls
      if (now - circuitBreaker.current.lastCallTime < 500) {
        circuitBreaker.current.consecutiveCalls++;
        if (circuitBreaker.current.consecutiveCalls > 5) {
          circuitBreaker.current.isOpen = true;
          circuitBreaker.current.openUntil = now + 10000; // 10 seconds
          console.log("🔥 Circuit breaker opened due to excessive calls");
          return;
        }
      } else {
        circuitBreaker.current.consecutiveCalls = 0;
      }

      circuitBreaker.current.lastCallTime = now;

      // Clear existing timeout
      if (preloadTimeout.current) {
        clearTimeout(preloadTimeout.current);
      }

      const addressesToResolve = addresses.filter((addr) => {
        const cached = getCachedBasename(addr.toLowerCase());
        return (
          cached === null && !resolutionQueue.current.has(addr.toLowerCase())
        );
      });

      if (addressesToResolve.length > 0) {
        // Rate limiting: minimum 2 seconds between batch requests
        const timeSinceLastBatch = now - lastBatchTime.current;
        const minInterval = 2000;
        const delay = Math.max(0, minInterval - timeSinceLastBatch);

        preloadTimeout.current = setTimeout(() => {
          lastBatchTime.current = Date.now();
          resolveBasenames(addressesToResolve);
        }, delay);
      }
    },
    [resolveBasenames, getCachedBasename],
  );

  // Clear cache
  const clearCache = useCallback(() => {
    setCache({});
    localStorage.removeItem("basename-cache");
    setStats({
      totalRequests: 0,
      cacheHits: 0,
      cdpSuccesses: 0,
      thirdwebSuccesses: 0,
      failures: 0,
      lastUpdate: Date.now(),
    });
    console.log("🗑️ Basename cache cleared");
  }, []);

  // Get cache statistics (memoized to prevent excessive calls)
  const getCacheStats = useMemo(() => {
    const cacheSize = Object.keys(cache).length;
    const hitRate =
      stats.totalRequests > 0
        ? (stats.cacheHits / stats.totalRequests) * 100
        : 0;

    const cdpStatus = getCDPStatus();

    return {
      ...stats,
      cacheSize,
      hitRate: Math.round(Math.min(hitRate, 100)), // Cap at 100%
      isResolving,
      cdpConfigured: cdpStatus.configured,
      cdpInitialized: cdpStatus.initialized,
      enabledProviders: [
        config.enableCDP && "CDP",
        config.enableThirdweb && "Thirdweb",
      ].filter(Boolean),
    };
  }, [cache, stats, isResolving, config.enableCDP, config.enableThirdweb]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      if (preloadTimeout.current) {
        clearTimeout(preloadTimeout.current);
      }
    };
  }, []);

  return {
    // Core functions
    resolveBasename: resolveSingleBasename,
    resolveBasenames,
    getDisplayName,
    preloadBasenames,

    // Cache management
    getCachedBasename,
    clearCache,

    // State
    isResolving,
    cache,

    // Statistics
    getCacheStats,
    stats,
  };
};

// Simple hook for single address resolution (for backwards compatibility)
export const useBasename = (address?: string) => {
  const resolver = useBasenameResolver();
  const [basename, setBasename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setBasename(null);
      return;
    }

    const resolveAddress = async () => {
      setIsLoading(true);

      // Check cache first
      const cached = resolver.getCachedBasename(address);
      if (cached !== null) {
        setBasename(cached);
        setIsLoading(false);
        return;
      }

      // Resolve from network
      const result = await resolver.resolveBasename(address);
      setBasename(result);
      setIsLoading(false);
    };

    resolveAddress();
  }, [address, resolver]);

  return {
    basename,
    isLoading,
    error: null, // Kept for backwards compatibility
  };
};

export default useBasenameResolver;
