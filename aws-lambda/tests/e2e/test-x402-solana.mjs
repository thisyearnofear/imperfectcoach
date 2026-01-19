
import { verifyX402Signature } from './lib/core-agent-handler.mjs';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

async function runTest() {
    console.log('🧪 Testing Solana x402 Verification logic...');

    // 1. Generate Mock Solana Keypair
    const keypair = nacl.sign.keyPair();
    const publicKey = bs58.encode(keypair.publicKey);
    console.log(`🔑 Generated Mock Wallet: ${publicKey}`);

    // 2. Create Challenge Data
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = "test-nonce-" + Date.now();
    const amount = "50000"; // 0.05 USDC

    const message = `x402 Payment Authorization
Scheme: exact
Network: solana-devnet
Asset: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
Amount: ${amount}
PayTo: SpecialistAgent123
Payer: ${publicKey}
Timestamp: ${timestamp}
Nonce: ${nonce}`;

    console.log('\n📝 Message to sign:');
    console.log(message);

    // 3. Sign Message (Ed25519)
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
    const signature = Buffer.from(signatureBytes).toString('base64');

    console.log(`\n✍️  Signature (Base64): ${signature.substring(0, 20)}...`);

    // 4. Construct Payment Header
    const header = {
        scheme: 'exact',
        network: 'solana-devnet',
        asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: amount,
        payTo: 'SpecialistAgent123',
        payerAddress: publicKey,
        timestamp,
        nonce,
        signature,
        message
    };

    const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64');

    // 5. Verify
    console.log('\n🔍 Verifying...');
    const result = await verifyX402Signature(headerBase64, amount, 'solana-devnet');

    if (result.verified) {
        console.log('✅ TEST PASSED: Solana signature verified successfully');
    } else {
        console.error('❌ TEST FAILED:', result.reason);
        process.exit(1);
    }

    // 6. Test Invalid Signature
    console.log('\n🧪 Testing Invalid Signature...');
    const invalidHeader = { ...header, signature: Buffer.from(new Uint8Array(64)).toString('base64') };
    const invalidBase64 = Buffer.from(JSON.stringify(invalidHeader)).toString('base64');

    const invalidResult = await verifyX402Signature(invalidBase64, amount, 'solana-devnet');

    if (!invalidResult.verified) {
        console.log('✅ TEST PASSED: Invalid signature correctly rejected');
    } else {
        console.error('❌ TEST FAILED: Invalid signature was accepted');
        process.exit(1);
    }
}

runTest().catch(console.error);
