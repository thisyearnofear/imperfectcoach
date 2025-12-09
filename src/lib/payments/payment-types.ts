// Payment Types - Single Source of Truth
// Lean, focused on actual needs (removed routing/fee estimation)

import type { X402Network } from './x402-chains';

// Blockchain score interface
export interface BlockchainScore {
  user: string;
  pullups: number;
  jumps: number;
  timestamp: number;
  chainId?: number;
}

// User profile (cross-chain)
export interface UserProfile {
  address: string;
  username?: string;
  totalPullups: number;
  totalJumps: number;
  lastSubmission: number;
  rank?: number;
}

// Enhanced contract config for multi-chain
export interface ContractConfig {
  address: string;
  abi: readonly unknown[];
  chainId?: number;
}