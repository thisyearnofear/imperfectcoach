// x402 Protocol Signer - MINIMAL & CORRECT
// Signs server-provided challenges per x402 protocol
// Server sends challenge, client signs, server verifies

import { recoverAddress } from 'viem';

export interface X402Challenge {
  amount: string;
  asset: string;
  network: 'base-sepolia' | 'avalanche-c-chain' | 'solana-devnet';
  payTo: string;
  scheme: string;
  timestamp: number;
  nonce: string;
}

export interface SignedPayment extends X402Challenge {
  signature: string;
  payer: string;
}

/**
 * Sign an x402 challenge from the server.
 * The challenge defines what you're authorizing to pay.
 * You sign it exactly as provided—no modifications.
 */
export async function signChallenge(
  challenge: X402Challenge,
  wallet: any,
  userAddress: string
): Promise<SignedPayment> {
  // Reconstruct the exact message the server expects us to sign
  const message = serializeChallenge(challenge);

  // Sign with wallet (EVM chains: Base, Avalanche)
  if (challenge.network === 'base-sepolia' || challenge.network === 'avalanche-c-chain') {
    const signature = await wallet.signMessage({
      account: userAddress as `0x${string}`,
      message
    });

    return {
      ...challenge,
      signature,
      payer: userAddress
    };
  }

  // Sign with Solana wallet
  if (challenge.network === 'solana-devnet') {
    const encodedMessage = new TextEncoder().encode(message);
    const signatureBytes = await wallet.signMessage(encodedMessage);
    const signature = Buffer.from(signatureBytes).toString('hex');

    return {
      ...challenge,
      signature,
      payer: userAddress
    };
  }

  throw new Error(`Unsupported network: ${challenge.network}`);
}

/**
 * Serialize challenge to a deterministic string for signing.
 * Must match server's reconstruction exactly.
 */
function serializeChallenge(challenge: X402Challenge): string {
  return JSON.stringify({
    amount: challenge.amount,
    asset: challenge.asset,
    network: challenge.network,
    payTo: challenge.payTo,
    scheme: challenge.scheme,
    timestamp: challenge.timestamp,
    nonce: challenge.nonce
  });
}

/**
 * Encode signed payment for X-Payment header (base64).
 * Server will base64 decode this and verify signature.
 */
export function encodePaymentHeader(payment: SignedPayment): string {
  return btoa(JSON.stringify(payment));
}

/**
 * Decode X-Payment header from server responses (for debugging).
 */
export function decodePaymentHeader(header: string): SignedPayment {
  return JSON.parse(Buffer.from(header, 'base64').toString());
}
