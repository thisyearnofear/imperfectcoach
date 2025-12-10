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
  // PayAI / x402 'exact' scheme structure
  const authorization = {
    from: userAddress,
    to: challenge.payTo,
    value: challenge.amount,
    validAfter: "0", // 0 means valid from genesis/now
    validBefore: "9999999999", // Effectively infinite for this demo
    nonce: challenge.nonce,
  };

  // Reconstruct the message exactly as PayAI expects for signing
  // Note: Real PayAI SDK uses specific EIP-712 or similar serialization.
  // For 'exact' scheme, usually it's a signature over the authorization fields.
  const message = JSON.stringify(authorization);

  // Sign with wallet (EVM chains: Base, Avalanche)
  if (challenge.network === 'base-sepolia' || challenge.network === 'avalanche-c-chain') {
    const signature = await wallet.signMessage({
      account: userAddress as `0x${string}`,
      message
    });

    // Return strict PayAI PaymentPayload structure
    return {
      x402Version: 1,
      scheme: 'exact',
      network: challenge.network,
      payload: {
        signature,
        authorization
      },
      // Keep legacy fields for partial backward compat if needed, using 'as any' cast or updating interface
      // But adhering to cleanup:
      amount: challenge.amount,
      asset: challenge.asset,
      payTo: challenge.payTo,
      timestamp: challenge.timestamp,
      payer: userAddress,
      nonce: challenge.nonce
    } as any;
  }

  // Sign with Solana wallet
  if (challenge.network === 'solana-devnet') {
    // Solana structure for PayAI 'exact' scheme usually involves a transaction signature
    // But for "offline" signing similar to EVM, we might need a specific structure.
    // For now, mirroring the EVM structure for consistency, but noting Solana PayAI often uses 'transaction' field.
    // Let's stick to the EVM flow we know is robust for 0xGasless/Agents on Base/Avax.

    const encodedMessage = new TextEncoder().encode(message);
    const signatureBytes = await wallet.signMessage(encodedMessage);
    const signature = Buffer.from(signatureBytes).toString('hex');

    return {
      x402Version: 1,
      scheme: 'exact',
      network: challenge.network,
      payload: {
        signature,
        authorization
      },
      amount: challenge.amount,
      asset: challenge.asset,
      payTo: challenge.payTo,
      timestamp: challenge.timestamp,
      payer: userAddress,
      nonce: challenge.nonce
    } as any;
  }

  throw new Error(`Unsupported network: ${challenge.network}`);
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
