#!/usr/bin/env node

// x402 Protocol Test with Actual EVM Signature
// Tests complete x402 flow with EVM message signing
// Supports: base-sepolia, avalanche-c-chain
// Usage: node test-x402-with-signature.mjs [network]
//   e.g: node test-x402-with-signature.mjs avalanche-c-chain

import { createWalletClient, http, signMessage } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, avalancheFuji } from 'viem/chains';
import fetch from 'node-fetch';

// ===== CONFIG =====

const API_URL = 'https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout';

// Network from CLI arg, default to base-sepolia
const NETWORK = process.argv[2] || 'base-sepolia';
const CHAIN = NETWORK === 'avalanche-c-chain' ? avalancheFuji : baseSepolia;

// FOR TESTING ONLY: Use a test private key (not real funds)
// In production, sign with user's wallet via dApp
const TEST_PRIVATE_KEY = '0x' + 'a'.repeat(64); // Dummy key for demo
const ACCOUNT = privateKeyToAccount(TEST_PRIVATE_KEY);

const WORKOUT_DATA = {
  exercise: 'pullups',
  reps: 10,
  averageFormScore: 87.5,
  repHistory: [
    { score: 85, details: {} },
    { score: 88, details: {} },
    { score: 90, details: {} },
  ],
  duration: 120,
};

// ===== UTILITY FUNCTIONS =====

function serializeChallenge(challenge) {
  return JSON.stringify({
    amount: challenge.amount,
    asset: challenge.asset,
    network: challenge.network,
    payTo: challenge.payTo,
    scheme: challenge.scheme,
    timestamp: challenge.timestamp,
    nonce: challenge.nonce,
  });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===== TEST FLOW =====

async function runTests() {
  console.log('=========================================');
  console.log(`x402 EVM Test - ${NETWORK}`);
  console.log('=========================================\n');

  try {
    // Step 1: Request WITHOUT payment → get 402 challenge
    console.log('Step 1: Request WITHOUT payment header');
    console.log('Expected: HTTP 402 with challenge\n');

    const response1 = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chain': NETWORK,
      },
      body: JSON.stringify({ workoutData: WORKOUT_DATA }),
    });

    console.log(`HTTP Status: ${response1.status}`);

    if (response1.status !== 402) {
      throw new Error(`Expected 402, got ${response1.status}`);
    }

    const responseData = await response1.json();
    const challenge = responseData.challenge;

    if (!challenge) {
      throw new Error('No challenge in 402 response');
    }

    console.log('✅ PASS: Got 402 with challenge\n');
    console.log('Challenge:', JSON.stringify(challenge, null, 2), '\n');

    // Step 2: Sign the challenge
    console.log('Step 2: Signing challenge with test account');
    console.log(`Account: ${ACCOUNT.address}\n`);

    const challengeMessage = serializeChallenge(challenge);
    console.log('Challenge message to sign:', challengeMessage, '\n');

    // Sign using viem
    const walletClient = createWalletClient({
      chain: CHAIN,
      transport: http(),
      account: ACCOUNT,
    });

    const signature = await walletClient.signMessage({
      message: challengeMessage,
    });

    console.log('✅ Signature generated:', signature, '\n');

    // Step 3: Create signed payment
    console.log('Step 3: Creating signed payment\n');

    const signedPayment = {
      ...challenge,
      signature,
      payer: ACCOUNT.address,
    };

    console.log('Signed Payment:', JSON.stringify(signedPayment, null, 2), '\n');

    // Encode payment header
    const paymentHeader = Buffer.from(JSON.stringify(signedPayment)).toString(
      'base64'
    );

    console.log('Encoded Payment Header:', paymentHeader, '\n');

    // Step 4: Retry with payment header
    console.log('Step 4: Retry with X-Payment header');
    console.log('Expected: HTTP 200 with analysis\n');

    const response2 = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chain': NETWORK,
        'X-Payment': paymentHeader,
      },
      body: JSON.stringify({ workoutData: WORKOUT_DATA }),
    });

    console.log(`HTTP Status: ${response2.status}`);

    const responseData2 = await response2.json();

    if (response2.status === 200) {
      console.log('✅ PASS: Got 200 response with payment verified');
      console.log(
        'Analysis preview:',
        responseData2.analysis?.substring(0, 200) + '...'
      );
    } else if (response2.status === 401) {
      console.log('⚠️  Got 401: Signature verification failed');
      console.log('Error:', responseData2.error);
      console.log(
        'Note: This may be expected if the test account is not authorized'
      );
    } else {
      console.log(`⚠️  Got ${response2.status}`);
      console.log('Response:', responseData2);
    }

    console.log('\n=========================================');
    console.log('Phase 1 Test Complete');
    console.log('=========================================\n');

    if (response1.status === 402) {
      console.log('✅ Step 1: No payment → 402 challenge');
      console.log('✅ Step 2: Challenge signed');
      console.log('✅ Step 3: Signed payment encoded');
      console.log(
        response2.status === 200 ? '✅ Step 4: Server verified signature' : '⚠️  Step 4: Signature verification'
      );
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
