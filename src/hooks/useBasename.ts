import { useState, useEffect, useRef } from "react";
import {
  resolveL2Name,
  BASENAME_RESOLVER_ADDRESS,
} from "thirdweb/extensions/ens";
import { createThirdwebClient } from "thirdweb";
import { base } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId:
    import.meta.env.VITE_THIRDWEB_CLIENT_ID ||
    "cd2fc16a6b59aa67ccaa3c76eaa421f3",
});

// Cache to prevent redundant fetches
const basenameCache = new Map<string, { name: string | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useBasename = (address?: string) => {
  const [basename, setBasename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const resolveBasename = async () => {
      if (!address) {
        setBasename(null);
        return;
      }

      // Check cache first
      const cached = basenameCache.get(address.toLowerCase());
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setBasename(cached.name);
        return;
      }

      // Prevent duplicate concurrent fetches
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const name = await resolveL2Name({
          client,
          address: address as `0x${string}`,
          resolverAddress: BASENAME_RESOLVER_ADDRESS,
          resolverChain: base,
        });

        const resolvedName = name && name.length > 0 ? name : null;
        
        // Update cache
        basenameCache.set(address.toLowerCase(), {
          name: resolvedName,
          timestamp: Date.now(),
        });

        setBasename(resolvedName);
      } catch (err) {
        // Cache the null result to prevent repeated failed lookups
        basenameCache.set(address.toLowerCase(), {
          name: null,
          timestamp: Date.now(),
        });
        setBasename(null);
        setError(null);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    resolveBasename();
  }, [address]);

  return {
    basename,
    isLoading,
    error,
  };
};
