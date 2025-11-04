import { useState, useEffect } from 'react';

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

export const useMemoryIdentity = (
  walletAddress: string | undefined,
  options: UseMemoryIdentityOptions = {}
) => {
  const { enabled = true } = options;
  const [identityGraph, setIdentityGraph] = useState<IdentityGraph | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress || !enabled) {
      setIdentityGraph(null);
      setError(null);
      return;
    }

    const fetchIdentityGraph = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Note: Requires MEMORY_API_KEY environment variable
        const apiKey = import.meta.env.VITE_MEMORY_API_KEY;
        if (!apiKey) {
          throw new Error('Memory API key not configured');
        }

        const response = await fetch(
          `https://api.memoryproto.co/v1/identity-graph/wallet/${walletAddress}`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Gracefully handle "not found" by treating as empty identity graph
        if (response.status === 404) {
          // No identity graph exists yet for this wallet
          setIdentityGraph({ identities: [] });
          setError(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`Memory API error: ${response.status}`);
        }

        const data = await response.json();
        setIdentityGraph(data);
      } catch (err) {
        console.error('Failed to fetch identity graph:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch identity graph');
        setIdentityGraph(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIdentityGraph();
  }, [walletAddress, enabled]);

  // Helper function to get primary social identity
  const getPrimarySocialIdentity = () => {
    if (!identityGraph?.identities) return null;

    // Prioritize Farcaster, then Twitter
    const farcaster = identityGraph.identities.find(id => id.platform === 'farcaster');
    if (farcaster) return farcaster;

    const twitter = identityGraph.identities.find(id => id.platform === 'twitter');
    if (twitter) return twitter;

    return null;
  };

  // Helper to get all social identities
  const getSocialIdentities = () => {
    if (!identityGraph?.identities) return [];

    return identityGraph.identities.filter(identity =>
      ['farcaster', 'twitter', 'github', 'lens'].includes(identity.platform)
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
