/**
 * Cryptographic Signature Verification
 * 
 * Supports:
 * - EIP-191 signatures (EVM chains: Ethereum, Base, Avalanche, etc.)
 * - Ed25519 signatures (Solana)
 * 
 * Usage:
 *   const isValid = await verifySignature(message, signature, signer, 'evm');
 *   const isValid = await verifySignature(message, signature, signer, 'solana');
 */

import { recoverMessageAddress, toBytes } from 'viem';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Verify EIP-191 signed message (EVM chains)
 * @param {string} message - Original message that was signed
 * @param {string} signature - 0x-prefixed hex signature
 * @param {string} expectedSigner - 0x-prefixed hex address that should have signed
 * @returns {Promise<boolean>} true if signature is valid
 */
export async function verifyEVMSignature(message, signature, expectedSigner) {
    try {
        if (!signature?.startsWith('0x') || !expectedSigner?.startsWith('0x')) {
            console.warn('⚠️ Invalid EVM signature format (must be 0x-prefixed hex)');
            return false;
        }

        // Recover the address that signed the message
        const recoveredAddress = await recoverMessageAddress({
            message,
            signature
        });

        const isValid = recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
        
        if (isValid) {
            console.log(`✅ EVM signature verified: ${expectedSigner.slice(0, 6)}...`);
        } else {
            console.warn(`❌ EVM signature verification failed: signer mismatch`);
            console.warn(`   Expected: ${expectedSigner.toLowerCase()}`);
            console.warn(`   Got: ${recoveredAddress.toLowerCase()}`);
        }
        
        return isValid;
    } catch (error) {
        console.error(`❌ EVM signature verification error: ${error.message}`);
        return false;
    }
}

/**
 * Verify Ed25519 signed message (Solana)
 * @param {string} message - Original message that was signed
 * @param {string} signature - Base58-encoded Ed25519 signature
 * @param {string} publicKey - Base58-encoded Solana public key
 * @returns {Promise<boolean>} true if signature is valid
 */
export async function verifySolanaSignature(message, signature, publicKey) {
    try {
        if (!signature || !publicKey) {
            console.warn('⚠️ Missing Solana signature or public key');
            return false;
        }

        // Decode from base58
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = bs58.decode(publicKey);
        const messageBytes = toBytes(message);

        // Verify using TweetNaCl
        const isValid = nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKeyBytes
        );

        if (isValid) {
            console.log(`✅ Solana signature verified: ${publicKey.slice(0, 6)}...`);
        } else {
            console.warn(`❌ Solana signature verification failed`);
        }

        return isValid;
    } catch (error) {
        console.error(`❌ Solana signature verification error: ${error.message}`);
        return false;
    }
}

/**
 * Unified signature verification
 * @param {string} message - Message that was signed
 * @param {string} signature - Signature (format depends on chain)
 * @param {string} signer - Signer address (format depends on chain)
 * @param {string} chain - 'evm' | 'solana'
 * @returns {Promise<boolean>} true if signature is valid
 */
export async function verifySignature(message, signature, signer, chain = 'evm') {
    if (!message || !signature || !signer) {
        console.warn('⚠️ Missing message, signature, or signer');
        return false;
    }

    switch (chain.toLowerCase()) {
        case 'evm':
        case 'ethereum':
        case 'base':
        case 'avalanche':
            return await verifyEVMSignature(message, signature, signer);

        case 'solana':
            return await verifySolanaSignature(message, signature, signer);

        default:
            console.error(`❌ Unknown chain: ${chain}`);
            return false;
    }
}

/**
 * Verify agent registration identity proof
 * Agents must sign: { agentId, endpoint, timestamp }
 * 
 * @param {object} profile - Agent profile { id, endpoint, signer, chain }
 * @param {string} signature - Signed identity proof
 * @returns {Promise<boolean>} true if signature is valid
 */
export async function verifyAgentIdentity(profile, signature) {
    if (!profile?.id || !profile?.endpoint || !profile?.signer || !signature) {
        console.warn('⚠️ Incomplete agent profile for verification');
        return false;
    }

    // Message that agent must have signed
    const message = JSON.stringify({
        agentId: profile.id,
        endpoint: profile.endpoint,
        timestamp: profile.timestamp || Math.floor(Date.now() / 1000)
    });

    // Verify using appropriate chain
    const chain = profile.chain || 'evm';
    const isValid = await verifySignature(message, signature, profile.signer, chain);

    return isValid;
}
