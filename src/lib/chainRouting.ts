import { CHAIN_IDS } from "./config";

export type ChainType = "base" | "avalanche" | "solana";

export interface ChainRoutingState {
  baseAddress?: string;
  solanaAddress?: string;
  isBaseConnected: boolean;
  isSolanaConnected: boolean;
  chainId?: number; // Current EVM chain ID to detect Avalanche vs Base
}

/**
 * Determine which chains are available for the user
 */
export function getAvailableChains(state: ChainRoutingState): ChainType[] {
  const chains: ChainType[] = [];
  if (state.isBaseConnected && state.baseAddress) {
    // Detect if on Avalanche Fuji or Base Sepolia
    if (state.chainId === CHAIN_IDS.AVALANCHE_FUJI) {
      chains.push("avalanche");
    } else {
      chains.push("base");
    }
  }
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
  switch (chain) {
    case "base":
      return "Base Sepolia";
    case "avalanche":
      return "Avalanche Fuji";
    case "solana":
      return "Solana Devnet";
    default:
      return "Unknown";
  }
}
