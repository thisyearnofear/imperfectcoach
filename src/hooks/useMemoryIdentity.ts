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

// Cache for identity graph requests with global singleton
let identityCache: Map<string, { data: IdentityGraph | null; timestamp: number; error: string | null }>;
let cacheInitialized = false;

if (!cacheInitialized) {
  identityCache = new Map();
  cacheInitialized = true;
}

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
      console.log('[useMemoryIdentity] Fetching for wallet:', walletAddress, 'enabled:', enabled);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const fetchIdentityGraph = async () => {
        // Check cache first
        const cached = identityCache.get(walletAddress);
        const now = Date.now();
        const cacheAge = cached ? now - cached.timestamp : Infinity;
        const maxAge = cached?.error ? FAILED_CACHE_AGE : MAX_CACHE_AGE;

        if (cached && cacheAge < maxAge) {
          console.log('[useMemoryIdentity] Using cached data');
          setIdentityGraph(cached.data);
          setError(cached.error);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

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

          console.log('[useMemoryIdentity] Making API request');
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
            // No identity graph exists yet for this wallet
            const emptyGraph = { identities: [] };
            setIdentityGraph(emptyGraph);
            setError(null);
            identityCache.set(walletAddress, { data: emptyGraph, timestamp: now, error: null });
            return;
          }

          if (!response.ok) {
            throw new Error(`Memory API error: ${response.status}`);
          }

          const data = await response.json();
          console.log('[useMemoryIdentity] Got response with', data?.length || 0, 'identities');
          // API returns an array directly, wrap it in the IdentityGraph interface
          const identityGraph = Array.isArray(data) ? { identities: data } : data;
          setIdentityGraph(identityGraph);
          identityCache.set(walletAddress, { data: identityGraph, timestamp: now, error: null });
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            // Request was cancelled, don't update state
            return;
          }

          // Only log errors in development to reduce console spam
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to fetch identity graph:', err);
          }

          const errorMsg = err instanceof Error ? err.message : 'Failed to fetch identity graph';
          setError(errorMsg);
          setIdentityGraph(null);
          identityCache.set(walletAddress, { data: null, timestamp: now, error: errorMsg });
        } finally {
          setIsLoading(false);
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
      console.log('[getSocialIdentities] No identity graph or identities:', { identityGraph, isArray: Array.isArray(identityGraph?.identities) });
      return [];
    }

    const filtered = identityGraph.identities.filter(identity =>
      identity && ['farcaster', 'twitter', 'github', 'lens', 'zora'].includes(identity.platform)
    );
    console.log('[getSocialIdentities] Filtered from', identityGraph.identities.length, 'to', filtered.length);
    return filtered;
  };

  return {
    identityGraph,
    isLoading,
    error,
    getPrimarySocialIdentity,
    getSocialIdentities,
  };
};
