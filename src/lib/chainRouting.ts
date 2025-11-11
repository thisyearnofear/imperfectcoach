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
