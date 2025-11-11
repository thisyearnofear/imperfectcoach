import { useState, useEffect, useRef } from 'react';

interface IdentityNode {
  id: string;
  platform: string;
  url?: string;
  avatar?: string;
  username?: string;
  social?: {
    followers?: number;
    following?: number;
    verified?: boolean | null;
  };
  sources?: Array<{
    id: string;
    platform: string;
    verified: boolean;
  }>;
}

interface IdentityGraph {
  identities: IdentityNode[];
}

interface UseMemoryIdentityOptions {
  enabled?: boolean;
}

// Create a global cache using window object to ensure it's shared across all instances
// This prevents multiple API calls for the same wallet address across different components
const getGlobalCache = (): Map<string, { data: IdentityGraph | null; timestamp: number; error: string | null }> => {
  if (typeof window !== 'undefined') {
    // Create a property on the window object to share the cache
    if (!(window as any).__memoryIdentityCache) {
      (window as any).__memoryIdentityCache = new Map();
    }
    return (window as any).__memoryIdentityCache;
  }
  // Fallback for SSR or environments without window
  return new Map();
};

// Global in-flight request tracker to prevent concurrent API calls for the same address
const inFlightRequests = new Map<string, Promise<IdentityGraph | null>>();

// Cache cleanup function to remove expired entries
const cleanupExpiredCacheEntries = () => {
  const identityCache = getGlobalCache();
  const now = Date.now();
  
  for (const [walletAddress, cacheEntry] of identityCache.entries()) {
    const cacheAge = now - cacheEntry.timestamp;
    const maxAge = cacheEntry.error ? FAILED_CACHE_AGE : MAX_CACHE_AGE;
    
    if (cacheAge >= maxAge) {
      identityCache.delete(walletAddress);
    }
  }
};

const MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes
const FAILED_CACHE_AGE = 5 * 60 * 1000; // 5 minutes for failed requests (increased to reduce API calls)
const DEBOUNCE_DELAY = 2000; // 2 second debounce to prevent rapid calls
const REQUEST_COOLDOWN = 1000; // Additional cooldown between requests

export const useMemoryIdentity = (
  walletAddress: string | undefined,
  options: UseMemoryIdentityOptions = {}
) => {
  const { enabled = true } = options;
  const [identityGraph, setIdentityGraph] = useState<IdentityGraph | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestTime = useRef<number>(0);

  useEffect(() => {
    if (!walletAddress || !enabled) {
      setIdentityGraph(null);
      setError(null);
      return;
    }

    // Check if we've made a request recently
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;

    // Clear previous debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Enhanced debouncing with request cooldown
    const debounceTime = Math.max(DEBOUNCE_DELAY, timeSinceLastRequest < REQUEST_COOLDOWN ? REQUEST_COOLDOWN - timeSinceLastRequest : 0);

    debounceTimeoutRef.current = setTimeout(() => {
      lastRequestTime.current = Date.now();

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const fetchIdentityGraph = async () => {
        // Clean up expired cache entries before checking
        cleanupExpiredCacheEntries();
        
        // Get the shared global cache
        const identityCache = getGlobalCache();
        
        // Check cache first
        const cached = identityCache.get(walletAddress);
        const now = Date.now();
        const cacheAge = cached ? now - cached.timestamp : Infinity;
        const maxAge = cached?.error ? FAILED_CACHE_AGE : MAX_CACHE_AGE;

        if (cached && cacheAge < maxAge) {
          setIdentityGraph(cached.data);
          setError(cached.error);
          setIsLoading(false);
          return;
        }

        // Check if there's already a request in-flight for this address
        const existingRequest = inFlightRequests.get(walletAddress);
        if (existingRequest) {
          setIsLoading(true);
          try {
            const result = await existingRequest;
            setIdentityGraph(result);
            setError(null);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch identity graph';
            setError(errorMsg);
            setIdentityGraph(null);
          } finally {
            setIsLoading(false);
          }
          return;
        }

        setIsLoading(true);
        setError(null);

        // Create the request promise and store it
        const requestPromise = (async (): Promise<IdentityGraph | null> => {
          try {
          // Note: Requires MEMORY_API_KEY environment variable
          const apiKey = import.meta.env.VITE_MEMORY_API_KEY;
          if (!apiKey) {
            // Gracefully handle missing API key - don't make requests
            const emptyGraph = { identities: [] };
            setIdentityGraph(emptyGraph);
            setError(null);
            identityCache.set(walletAddress, { data: emptyGraph, timestamp: now, error: null });
            return;
          }

            const response = await fetch(
              `https://api.memoryproto.co/identities/wallet/${walletAddress}`,
              {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
                signal: abortControllerRef.current?.signal,
              }
            );

            // Gracefully handle "not found" by treating as empty identity graph
            if (response.status === 404) {
              const emptyGraph = { identities: [] };
              identityCache.set(walletAddress, { data: emptyGraph, timestamp: now, error: null });
              return emptyGraph;
            }

            if (!response.ok) {
              throw new Error(`Memory API error: ${response.status}`);
            }

            const data = await response.json();
            // API returns an array directly, wrap it in the IdentityGraph interface
            const identityGraph = Array.isArray(data) ? { identities: data } : data;
            identityCache.set(walletAddress, { data: identityGraph, timestamp: now, error: null });
            return identityGraph;
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
              throw err;
            }
            // Only log errors in development to reduce console spam
            if (process.env.NODE_ENV === 'development') {
              console.warn('Failed to fetch identity graph:', err);
            }
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch identity graph';
            identityCache.set(walletAddress, { data: null, timestamp: now, error: errorMsg });
            throw new Error(errorMsg);
          }
        })();

        // Store the promise so other instances can reuse it
        inFlightRequests.set(walletAddress, requestPromise);

        try {
          const result = await requestPromise;
          setIdentityGraph(result);
          setError(null);
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            return;
          }
          const errorMsg = err instanceof Error ? err.message : 'Failed to fetch identity graph';
          setError(errorMsg);
          setIdentityGraph(null);
        } finally {
          setIsLoading(false);
          // Clean up the in-flight request
          inFlightRequests.delete(walletAddress);
        }
      };

      fetchIdentityGraph();
    }, debounceTime);

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [walletAddress, enabled]);

  // Helper function to get primary social identity
  const getPrimarySocialIdentity = () => {
    if (!identityGraph || !identityGraph.identities || !Array.isArray(identityGraph.identities)) {
      return null;
    }

    // Prioritize Farcaster, then Twitter
    const farcaster = identityGraph.identities.find(id => id && id.platform === 'farcaster');
    if (farcaster) return farcaster;

    const twitter = identityGraph.identities.find(id => id && id.platform === 'twitter');
    if (twitter) return twitter;

    return null;
  };

  // Helper to get all social identities
  const getSocialIdentities = () => {
    if (!identityGraph || !identityGraph.identities || !Array.isArray(identityGraph.identities)) {
      return [];
    }

    return identityGraph.identities.filter(identity =>
      identity && ['farcaster', 'twitter', 'github', 'lens', 'zora'].includes(identity.platform)
    );
  };

  return {
    identityGraph,
    isLoading,
    error,
    getPrimarySocialIdentity,
    getSocialIdentities,
  };
};
