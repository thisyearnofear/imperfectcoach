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

// Cache for identity graph requests
const identityCache = new Map<string, { data: IdentityGraph | null; timestamp: number; error: string | null }>();
const MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes
const FAILED_CACHE_AGE = 1 * 60 * 1000; // 1 minute for failed requests

export const useMemoryIdentity = (
  walletAddress: string | undefined,
  options: UseMemoryIdentityOptions = {}
) => {
  const { enabled = true } = options;
  const [identityGraph, setIdentityGraph] = useState<IdentityGraph | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!walletAddress || !enabled) {
      setIdentityGraph(null);
      setError(null);
      return;
    }

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
          throw new Error('Memory API key not configured');
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
        console.error('Failed to fetch identity graph:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch identity graph';
        setError(errorMsg);
        setIdentityGraph(null);
        identityCache.set(walletAddress, { data: null, timestamp: now, error: errorMsg });
      } finally {
        setIsLoading(false);
      }
    };

    fetchIdentityGraph();

    // Cleanup
    return () => {
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
