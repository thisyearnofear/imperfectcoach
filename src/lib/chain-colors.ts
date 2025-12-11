/**
 * Chain color utilities - single source of truth for chain visual indicators
 * Following core principle: DRY (Single source of truth for all shared logic)
 */

export type ChainColor = 'blue' | 'red' | 'purple' | 'green' | 'gray';

export interface ChainColorConfig {
  bg: string;
  text: string;
  border: string;
  badge: string;
}

/**
 * Get color scheme based on chain ID
 * Base Sepolia: 84532 -> blue
 * Avalanche Fuji: 43113 -> red
 * Solana: null -> purple
 * EVM unconnected: null -> green
 */
export const getChainColor = (chainId?: number | null): ChainColor => {
  if (chainId === 84532) return 'blue';     // Base Sepolia
  if (chainId === 43113) return 'red';      // Avalanche Fuji
  return 'gray';
};

export const getSolanaColor = (): ChainColor => 'purple';

export const getEVMUnconnectedColor = (): ChainColor => 'green';

/**
 * Get Tailwind classes for a chain color
 */
export const getChainColorClasses = (color: ChainColor): ChainColorConfig => {
  const colorMap: Record<ChainColor, ChainColorConfig> = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700',
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      badge: 'bg-purple-100 text-purple-700',
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      badge: 'bg-green-100 text-green-700',
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      badge: 'bg-gray-100 text-gray-700',
    },
  };

  return colorMap[color];
};

/**
 * Get chain name for display
 */
export const getChainName = (chainId?: number | null): string => {
  if (chainId === 84532) return 'Base';
  if (chainId === 43113) return 'Avalanche';
  return 'Unknown';
};
