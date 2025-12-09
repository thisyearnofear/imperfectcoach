// Payment Components Index - ORGANIZED structure

export { PaymentStatus } from './PaymentStatus';

// Re-export x402 protocol utilities
export type { X402Challenge, SignedPayment } from '../../lib/payments/x402-signer';
export { signChallenge, encodePaymentHeader, decodePaymentHeader } from '../../lib/payments/x402-signer';

// Re-export network configuration
export type { X402Network, NetworkConfig } from '../../lib/payments/x402-chains';
export { X402_NETWORKS, getNetworkConfig, getAllNetworks, isEVMNetwork } from '../../lib/payments/x402-chains';

// Re-export payment types
export type { BlockchainScore, UserProfile, ContractConfig } from '../../lib/payments/payment-types';