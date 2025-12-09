#!/usr/bin/env node

// Phase 2: x402 Protocol Test with Solana Ed25519 Signature
// Tests complete x402 flow with Solana message signing

import nacl from 'tweetnacl';
import bs58 from 'bs58';
import fetch from 'node-fetch';

// ===== CONFIG =====

const API_URL = 'https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout';
const NETWORK = 'solana-devnet';

// Generate a test keypair (FOR TESTING ONLY)
const testKeypair = nacl.sign.keyPair();
const TEST_PUBLIC_KEY = bs58.encode(testKeypair.publicKey);

const WORKOUT_DATA = {
    exercise: 'pullups',
    reps: 12,
    averageFormScore: 89.0,
    repHistory: [
        { score: 87, details: {} },
        { score: 90, details: {} },
        { score: 91, details: {} },
    ],
    duration: 150,
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

function signMessage(message, secretKey) {
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, secretKey);
    return Buffer.from(signature).toString('hex');
}

function verifySignatureLocally(message, signatureHex, publicKeyBase58) {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signatureHex, 'hex');
    const publicKeyBytes = bs58.decode(publicKeyBase58);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
}

// ===== TEST FLOW =====

async function runTests() {
    console.log('=========================================');
    console.log('Phase 2: x402 Solana Ed25519 Test');
    console.log('=========================================\n');

    try {
        // Step 1: Request WITHOUT payment → get 402 challenge
        console.log('Step 1: Request WITHOUT payment header');
        console.log(`Network: ${NETWORK}`);
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

        console.log('✅ PASS: Got 402 with challenge');
        console.log('Challenge:', JSON.stringify(challenge, null, 2), '\n');

        // Verify challenge has Ed25519 scheme for Solana
        if (challenge.scheme !== 'ed25519') {
            console.log(`⚠️  Expected scheme 'ed25519', got '${challenge.scheme}'`);
        } else {
            console.log('✅ Correct scheme: ed25519\n');
        }

        // Step 2: Sign the challenge with Ed25519
        console.log('Step 2: Signing challenge with Ed25519 (test keypair)');
        console.log(`Test Public Key: ${TEST_PUBLIC_KEY}\n`);

        const challengeMessage = serializeChallenge(challenge);
        console.log('Challenge message to sign:', challengeMessage, '\n');

        // Sign using tweetnacl
        const signature = signMessage(challengeMessage, testKeypair.secretKey);
        console.log('✅ Signature generated:', signature.substring(0, 64) + '...\n');

        // Verify locally before sending
        const localVerification = verifySignatureLocally(challengeMessage, signature, TEST_PUBLIC_KEY);
        console.log(`Local verification: ${localVerification ? '✅ VALID' : '❌ INVALID'}\n`);

        // Step 3: Create signed payment
        console.log('Step 3: Creating signed payment\n');

        const signedPayment = {
            ...challenge,
            signature,
            payer: TEST_PUBLIC_KEY,
        };

        console.log('Signed Payment:', JSON.stringify({
            ...signedPayment,
            signature: signedPayment.signature.substring(0, 32) + '...'
        }, null, 2), '\n');

        // Encode payment header
        const paymentHeader = Buffer.from(JSON.stringify(signedPayment)).toString('base64');

        console.log('Encoded Payment Header length:', paymentHeader.length, '\n');

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
            console.log('Analysis preview:', responseData2.analysis?.substring(0, 200) + '...');
            console.log(`\nNetwork: ${responseData2.network}`);
            console.log(`Payer: ${responseData2.payer}`);
        } else if (response2.status === 401) {
            console.log('⚠️  Got 401: Signature verification failed');
            console.log('Error:', responseData2.error);
            console.log('Note: Check Lambda logs for verification details');
        } else {
            console.log(`⚠️  Got ${response2.status}`);
            console.log('Response:', responseData2);
        }

        console.log('\n=========================================');
        console.log('Phase 2 Solana Test Complete');
        console.log('=========================================\n');

        // Summary
        console.log('Summary:');
        console.log(`✅ Step 1: No payment → 402 challenge (scheme: ${challenge.scheme})`);
        console.log('✅ Step 2: Challenge signed with Ed25519');
        console.log(`✅ Step 3: Local verification: ${localVerification ? 'PASSED' : 'FAILED'}`);
        console.log(`${response2.status === 200 ? '✅' : '⚠️ '} Step 4: Server verification: ${response2.status}`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests
runTests();
