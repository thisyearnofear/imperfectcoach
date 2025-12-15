/**
 * Wallet validation utilities
 * Single source of truth for wallet data validation
 * Following core principle: CLEAN (Clear separation of concerns)
 */

import { PublicKey } from '@solana/web3.js';
import { CHAIN_IDS } from '../config';

export class WalletValidationError extends Error {
  constructor(message: string, public context?: string) {
    super(message);
    this.name = 'WalletValidationError';
  }
}

/**
 * Validate EVM wallet address format
 */
export const validateEvmAddress = (address: unknown): address is string => {
  if (typeof address !== 'string') return false;
  if (!address.startsWith('0x')) return false;
  if (address.length !== 42) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate and throw with context
 */
export const requireValidEvmAddress = (address: unknown, context?: string): string => {
  if (!validateEvmAddress(address)) {
    throw new WalletValidationError(
      `Invalid EVM address format: ${typeof address === 'string' ? address : String(address)}`,
      context
    );
  }
  return address;
};

/**
 * Validate Solana wallet address format
 */
export const validateSolanaAddress = (address: unknown): address is string => {
  if (typeof address !== 'string') return false;
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate and throw with context
 */
export const requireValidSolanaAddress = (address: unknown, context?: string): string => {
  if (!validateSolanaAddress(address)) {
    throw new WalletValidationError(
      `Invalid Solana address format: ${String(address)}`,
      context
    );
  }
  return address;
};

/**
 * Validate EVM chain ID is supported
 */
export const validateSupportedChainId = (chainId: unknown): boolean => {
  if (typeof chainId !== 'number') return false;
  return Object.values(CHAIN_IDS).includes(chainId);
};

/**
 * Validate and throw with context
 */
export const requireSupportedChainId = (chainId: unknown, context?: string): number => {
  if (!validateSupportedChainId(chainId)) {
    throw new WalletValidationError(
      `Unsupported chain ID: ${chainId}. Supported: ${Object.values(CHAIN_IDS).join(', ')}`,
      context
    );
  }
  return chainId as number;
};

/**
 * Validate signature format
 */
export const validateSignature = (signature: unknown): signature is string => {
  if (typeof signature !== 'string') return false;
  // Ethereum signatures are 0x-prefixed hex strings (130 chars = 0x + 128 hex)
  return /^0x[a-fA-F0-9]{130}$/.test(signature);
};

/**
 * Safe address shortening for display
 */
export const shortenAddress = (address: string, chars = 4): string => {
  if (!validateEvmAddress(address) && !validateSolanaAddress(address)) {
    return 'Invalid address';
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};
