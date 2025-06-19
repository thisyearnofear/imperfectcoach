import { useName } from "@coinbase/onchainkit/identity";
import { base } from "viem/chains";

export const useBasename = (address?: string) => {
  const {
    data: basename,
    isLoading,
    error,
  } = useName({
    address: address as `0x${string}`,
    chain: base, // Always use Base mainnet for basename resolution
  });

  return {
    basename,
    isLoading,
    error,
  };
};
