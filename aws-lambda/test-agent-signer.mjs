
import { signPaymentChallenge } from './lib/reap-integration.mjs';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

async function runTest() {
    console.log('🧪 Testing Multi-Chain Agent Signing...');

    // 1. Setup Mock Identity
    // Solana
    const solKeyPair = nacl.sign.keyPair();
    const solPrivateKey = bs58.encode(solKeyPair.secretKey);
    const solPublicKey = bs58.encode(solKeyPair.publicKey);
    console.log(`🔑 Mock Solana Key: ${solPublicKey}`);

    // EVM
    const evmPrivateKey = generatePrivateKey();
    const evmAccount = privateKeyToAccount(evmPrivateKey);
    console.log(`🔑 Mock EVM Key: ${evmAccount.address}`);

    // 2. Test Solana Signing
    console.log('\n🟣 Testing Solana Challenge Signing...');
    const solChallenge = {
        scheme: 'exact',
        network: 'solana-devnet',
        asset: 'USDC',
        amount: '50000',
        payTo: 'SpecialistAgentSOL',
        timestamp: Math.floor(Date.now() / 1000),
        nonce: 'test-nonce-sol'
    };

    const solResult = await signPaymentChallenge(solChallenge, evmPrivateKey, solPrivateKey);

    if (solResult && solResult.signer === solPublicKey && solResult.scheme === 'ed25519') {
        console.log('✅ Solana Signing SUCCESS');
        console.log(`   Signature: ${solResult.signature.substring(0, 20)}...`);
    } else {
        console.error('❌ Solana Signing FAILED');
        console.error(solResult);
        process.exit(1);
    }

    // 3. Test EVM Signing
    console.log('\n🔵 Testing EVM Challenge Signing...');
    const evmChallenge = {
        scheme: 'exact',
        network: 'base-sepolia',
        asset: 'USDC',
        amount: '50000',
        payTo: 'SpecialistAgentEVM',
        timestamp: Math.floor(Date.now() / 1000),
        nonce: 'test-nonce-evm'
    };

    const evmResult = await signPaymentChallenge(evmChallenge, evmPrivateKey, solPrivateKey);

    if (evmResult && evmResult.signer === evmAccount.address && evmResult.scheme === 'eip-191') {
        console.log('✅ EVM Signing SUCCESS');
        console.log(`   Signature: ${evmResult.signature.substring(0, 20)}...`);
    } else {
        console.error('❌ EVM Signing FAILED');
        console.error(evmResult);
        process.exit(1);
    }

    // 4. Test Missing Key (Solana) -> Should Fail Gracefully
    console.log('\n🧪 Testing Missing Key Handling...');
    const failResult = await signPaymentChallenge(solChallenge, evmPrivateKey, null); // No Sol Key
    if (failResult === null) {
        console.log('✅ Missing Key correctly verified (returned null)');
    } else {
        console.error('❌ Missing Key check FAILED');
        process.exit(1);
    }

    console.log('\n🎉 ALL TESTS PASSED');
}

runTest().catch(console.error);
