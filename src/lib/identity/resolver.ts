/**
 * Unified identity resolver service
 * Single source of truth for name resolution across all chains
 * 
 * Strategy:
 * - Base/Base Mainnet: Use Basename (via thirdweb)
 * - Avalanche/Avalanche Mainnet: Use ENS (via web3.bio)
 * - Solana: Use SNS (via spl-name-service)
 * - Fallback: Format address
 */

interface Web3BioProfile {
  address: string;
  identity: string;
  platform: string;
  displayName: string;
  avatar?: string;
}

// Cache for web3.bio lookups
const web3BioCache = new Map<string, { name: string | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch ENS name via web3.bio API
 * More reliable than direct viem calls, handles both addresses and ENS names
 */
export async function resolveENSViaWeb3Bio(address: string): Promise<string | null> {
  if (!address.startsWith('0x')) return null;

  // Check cache
  const cached = web3BioCache.get(address.toLowerCase());
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.name;
  }

  try {
    const response = await fetch(`https://api.web3.bio/ns/ens/${address}`);
    if (!response.ok) return null;

    const data: Web3BioProfile = await response.json();
    const name = data.identity || null;

    // Cache result
    web3BioCache.set(address.toLowerCase(), {
      name,
      timestamp: Date.now(),
    });

    return name;
  } catch (error) {
    console.debug('web3.bio ENS lookup failed:', error);
    return null;
  }
}

/**
 * Format address as truncated string
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get preferred name resolver for a chain
 */
export function getChainPreference(chain?: 'base' | 'avalanche' | 'solana'): 'basename' | 'ens' | 'sns' {
  switch (chain) {
    case 'base':
      return 'basename';
    case 'avalanche':
      return 'ens';
    case 'solana':
      return 'sns';
    default:
      return 'basename';
  }
}

/**
 * Determine if an address should attempt basename resolution
 */
export function shouldResolveBasename(chain?: string): boolean {
  return chain === 'base' || !chain;
}

/**
 * Determine if an address should attempt ENS resolution
 */
export function shouldResolveENS(chain?: string): boolean {
  return chain === 'avalanche';
}

/**
 * Determine if an address should attempt SNS resolution
 */
export function shouldResolveSNS(chain?: string): boolean {
  return chain === 'solana';
}
