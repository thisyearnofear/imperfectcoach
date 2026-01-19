/**
 * Test script for Privacy Cash verification functionality
 * 
 * This script tests the privacy verification logic in the core-agent-handler
 */

import { verifyX402Signature } from './lib/core-agent-handler.mjs';

console.log('🧪 Testing Privacy Cash Verification...\n');

// Test 1: Regular payment (non-privacy)
console.log('📋 Test 1: Regular x402 payment verification');
const regularPaymentHeader = Buffer.from(JSON.stringify({
  amount: "50000",
  payerAddress: "0x1234567890123456789012345678901234567890",
  signature: "0x...",
  message: "Regular payment message"
})).toString('base64');

try {
  const regularResult = await verifyX402Signature(regularPaymentHeader, "50000", "base-sepolia");
  console.log('✅ Regular payment verification:', regularResult.verified ? 'PASSED' : 'FAILED');
} catch (error) {
  console.log('❌ Regular payment verification failed:', error.message);
}

// Test 2: Privacy Cash payment
console.log('\n📋 Test 2: Privacy Cash payment verification');
const privacyPaymentHeader = Buffer.from(JSON.stringify({
  amount: "50000",
  payerAddress: "CmGgLQL36Y9ubtTsy2zmE46TAxwCBm66onZmPPhUWNqv",
  signature: "some_signature_here",
  message: "PrivacyProtocol: privacy-cash - TxHash: 5nZv2r7a1c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D"
})).toString('base64');

try {
  // Note: This test will likely fail because it requires actual on-chain verification
  // which needs a real transaction hash
  const privacyResult = await verifyX402Signature(privacyPaymentHeader, "50000", "solana-devnet");
  console.log('✅ Privacy Cash verification:', privacyResult.verified ? 'PASSED' : 'FAILED');
  if (!privacyResult.verified) {
    console.log('   Reason:', privacyResult.reason);
  }
} catch (error) {
  console.log('⚠️ Privacy Cash verification error (expected for fake TX):', error.message);
}

// Test 3: Insufficient amount
console.log('\n📋 Test 3: Insufficient payment amount');
const insufficientPaymentHeader = Buffer.from(JSON.stringify({
  amount: "30000", // Less than required 50000
  payerAddress: "0x1234567890123456789012345678901234567890",
  signature: "0x...",
  message: "Regular payment message"
})).toString('base64');

try {
  const insufficientResult = await verifyX402Signature(insufficientPaymentHeader, "50000", "base-sepolia");
  console.log('✅ Insufficient amount rejection:', !insufficientResult.verified ? 'PASSED' : 'FAILED');
  if (!insufficientResult.verified) {
    console.log('   Reason:', insufficientResult.reason);
  }
} catch (error) {
  console.log('❌ Insufficient amount test failed:', error.message);
}

console.log('\n🎯 Privacy verification tests completed!');