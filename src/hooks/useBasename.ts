import { useState, useEffect } from "react";
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

export const useBasename = (address?: string) => {
  const [basename, setBasename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveBasename = async () => {
      if (!address) {
        setBasename(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const name = await resolveL2Name({
          client,
          address: address as `0x${string}`,
          resolverAddress: BASENAME_RESOLVER_ADDRESS,
          resolverChain: base,
        });

        if (name && name.length > 0) {
          setBasename(name);
          console.log("✅ Thirdweb basename resolved:", name);
        } else {
          setBasename(null);
          console.log("ℹ️ No basename found for address:", address);
        }
      } catch (err) {
        console.log("ℹ️ No basename found for address:", address);
        setBasename(null);
        setError(null); // Don't treat this as an error, just no basename
      } finally {
        setIsLoading(false);
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
