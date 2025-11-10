import { toast } from "sonner";

export type ChainType = "base" | "solana";

export interface ChainRoutingState {
  baseAddress?: string;
  solanaAddress?: string;
  isBaseConnected: boolean;
  isSolanaConnected: boolean;
}

/**
 * Determine which chains are available for the user
 */
export function getAvailableChains(state: ChainRoutingState): ChainType[] {
  const chains: ChainType[] = [];
  if (state.isBaseConnected && state.baseAddress) chains.push("base");
  if (state.isSolanaConnected && state.solanaAddress) chains.push("solana");
  return chains;
}

/**
 * Determine the default chain to submit to based on connected wallets
 * - If only one chain is connected, use that one (no prompt)
 * - If both are connected, return null (caller should prompt user)
 * - If neither is connected, return "none"
 */
export function getDefaultChain(state: ChainRoutingState): ChainType | "none" | null {
  const availableChains = getAvailableChains(state);

  if (availableChains.length === 0) {
    return "none";
  }

  if (availableChains.length === 1) {
    return availableChains[0];
  }

  // Both chains connected - caller should prompt user
  return null;
}

/**
 * Get human-readable chain name
 */
export function getChainDisplayName(chain: ChainType): string {
  return chain === "base" ? "Base Sepolia" : "Solana Devnet";
}

/**
 * Validate submission can be made to a specific chain
 */
export function validateChainSubmission(
  chain: ChainType,
  state: ChainRoutingState
): { isValid: boolean; error?: string } {
  if (chain === "base") {
    if (!state.isBaseConnected || !state.baseAddress) {
      return { isValid: false, error: "Base wallet not connected" };
    }
    return { isValid: true };
  }

  if (chain === "solana") {
    if (!state.isSolanaConnected || !state.solanaAddress) {
      return { isValid: false, error: "Solana wallet not connected" };
    }
    return { isValid: true };
  }

  return { isValid: false, error: "Unknown chain" };
}

/**
 * Show appropriate toast message for chain routing
 */
export function showChainRoutingToast(
  action: "submit_start" | "submit_success" | "submit_error",
  chain: ChainType,
  details?: { txHash?: string; signature?: string; error?: string }
) {
  const chainName = getChainDisplayName(chain);

  switch (action) {
    case "submit_start":
      toast.loading(`Submitting to ${chainName}...`);
      break;

    case "submit_success":
      if (chain === "base" && details?.txHash) {
        toast.success(`✅ Score submitted to ${chainName}!`, {
          description: `Hash: ${details.txHash.slice(0, 10)}...`,
        });
      } else if (chain === "solana" && details?.signature) {
        toast.success(`✅ Score submitted to ${chainName}!`, {
          description: `Signature: ${details.signature.slice(0, 8)}...`,
        });
      } else {
        toast.success(`✅ Score submitted to ${chainName}!`);
      }
      break;

    case "submit_error":
      toast.error(`❌ Failed to submit to ${chainName}`, {
        description: details?.error || "Unknown error occurred",
      });
      break;
  }
}
