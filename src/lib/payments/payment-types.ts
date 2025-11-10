// Payment Types - Single Source of Truth
// Following DRY principle for unified multi-chain payment system

export type PaymentChain = 'base' | 'solana';
export type PaymentContext = 'micro' | 'premium' | 'agent';
export type PaymentStatus = 'pending' | 'settled' | 'failed' | 'expired';

// Enhanced blockchain score interface
export interface BlockchainScore {
  user: string;
  pullups: number;
  jumps: number;
  timestamp: number;
  chainId?: number; // Support multi-chain
}

// Enhanced user profile for multi-chain
export interface UserProfile {
  address: string;
  username?: string;
  totalPullups: number;
  totalJumps: number;
  lastSubmission: number;
  rank?: number;
  preferredChain?: PaymentChain; // User chain preference
}

// Unified payment request interface
export interface PaymentRequest {
  amount: bigint;
  context: PaymentContext;
  userAddress: string;
  timestamp: number;
  nonce: string;
  preferredChain?: PaymentChain;
}

// Chain-specific payment details
export interface BasePaymentDetails {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  payer: string;
  timestamp: number;
  nonce: string;
  signature: string;
  message: string;
}

export interface SolanaPaymentDetails {
  amount: bigint;
  recipient: string;
  reference?: string;
  label?: string;
  message?: string;
  memo?: string;
  signature?: string;
}

// Unified payment response
export interface PaymentResponse {
  success: boolean;
  chain: PaymentChain;
  transactionHash?: string;
  signature?: string;
  error?: string;
  fallbackUsed?: boolean;
}

// Fee estimation for chain selection
export interface FeeEstimate {
  chain: PaymentChain;
  estimatedFee: bigint;
  estimatedTime: number; // seconds
  networkHealth: 'healthy' | 'congested' | 'degraded';
}

// Smart routing decision
export interface ChainRoutingDecision {
  selectedChain: PaymentChain;
  reason: 'cost_optimal' | 'speed_optimal' | 'user_preference' | 'fallback';
  feeEstimate: FeeEstimate;
  alternatives: FeeEstimate[];
}

// x402 payment payload (unified interface)
export interface X402PaymentPayload {
  chain: PaymentChain;
  paymentDetails: BasePaymentDetails | SolanaPaymentDetails;
  encoded: string; // base64 encoded for headers
}

// Network status for monitoring
export interface NetworkStatus {
  base: {
    healthy: boolean;
    avgFee: bigint;
    avgConfirmationTime: number;
  };
  solana: {
    healthy: boolean;
    avgFee: bigint;
    avgConfirmationTime: number;
  };
}

// Enhanced contract config for multi-chain
export interface ContractConfig {
  address: string;
  abi: readonly unknown[];
  chainId?: number; // Support different chains
}

// Payment flow states for UX
export interface PaymentFlowState {
  step: 'selecting_chain' | 'creating_payment' | 'awaiting_signature' | 'processing' | 'completed' | 'failed';
  selectedChain?: PaymentChain;
  paymentRequest?: PaymentRequest;
  error?: string;
  transactionHash?: string;
}