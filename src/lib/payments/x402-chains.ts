// x402 Network Configurations
// Single source of truth for all supported chains

export type X402Network = 'base-sepolia' | 'avalanche-c-chain' | 'solana-devnet';

export interface NetworkConfig {
  name: string;
  network: X402Network;
  chainId?: number;
  rpcUrl: string;
  assetAddress: string;
  explorerUrl: string;
  iconUrl?: string;
}

export const X402_NETWORKS: Record<X402Network, NetworkConfig> = {
  'base-sepolia': {
    name: 'Base Sepolia',
    network: 'base-sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    assetAddress: '0x833589fCD6eDb6E08f4c7C32A07a5Fc5a7eCDA5c',
    explorerUrl: 'https://sepolia.basescan.org'
  },
  'avalanche-c-chain': {
    name: 'Avalanche C-Chain',
    network: 'avalanche-c-chain',
    chainId: 43113,
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    assetAddress: '0x5425890298aed601595a70AB815c96711a756003',
    explorerUrl: 'https://testnet.snowscan.xyz'
  },
  'solana-devnet': {
    name: 'Solana Devnet',
    network: 'solana-devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    assetAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
    explorerUrl: 'https://explorer.solana.com?cluster=devnet'
  }
};

/**
 * Get network config by name
 */
export function getNetworkConfig(network: X402Network): NetworkConfig {
  const config = X402_NETWORKS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }
  return config;
}

/**
 * Get all available networks
 */
export function getAllNetworks(): NetworkConfig[] {
  return Object.values(X402_NETWORKS);
}

/**
 * Check if network is EVM-compatible (uses same signing)
 */
export function isEVMNetwork(network: X402Network): boolean {
  return network === 'base-sepolia' || network === 'avalanche-c-chain';
}
