#!/usr/bin/env node
/**
 * Initialize Solana Leaderboard Accounts
 * This script creates the leaderboard data accounts for jumps and pullups programs
 */

import { Connection, Keypair, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Program IDs (deployed contracts)
const JUMPS_PROGRAM_ID = new PublicKey('7ugCR1KLjHNgUjbW1pZGCadeCHKvUu7NwXsXDTTFypUd');
const PULLUPS_PROGRAM_ID = new PublicKey('GDSkDgf6Q5mMN5kHZiKTXaAs2CLAkopDRDkSCM1tpcQa');

// Solana Devnet RPC
const RPC_URL = process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com';

async function initializeLeaderboard(programId, exerciseName) {
  console.log(`\n🏃 Initializing ${exerciseName} leaderboard...`);
  
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Load wallet from environment or generate a new one for testing
  const walletPath = process.env.SOLANA_WALLET_PATH || join(process.env.HOME, '.config/solana/id.json');
  let wallet;
  
  try {
    const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    wallet = Keypair.fromSecretKey(new Uint8Array(walletData));
    console.log(`📝 Using wallet: ${wallet.publicKey.toString()}`);
  } catch (error) {
    console.log('⚠️  No wallet found, generating a temporary one...');
    wallet = Keypair.generate();
    console.log(`📝 Generated wallet: ${wallet.publicKey.toString()}`);
    console.log('💰 You need to airdrop SOL to this wallet for gas fees');
    
    // Try to airdrop
    try {
      console.log('💸 Requesting airdrop...');
      const signature = await connection.requestAirdrop(wallet.publicKey, 1e9); // 1 SOL
      await connection.confirmTransaction(signature);
      console.log('✅ Airdrop successful');
    } catch (airdropError) {
      console.error('❌ Airdrop failed:', airdropError.message);
      console.log(`Run: solana airdrop 1 ${wallet.publicKey.toString()} --url devnet`);
      return null;
    }
  }
  
  // Generate a new keypair for the leaderboard account
  const leaderboardKeypair = Keypair.generate();
  console.log(`📋 Leaderboard account: ${leaderboardKeypair.publicKey.toString()}`);
  
  // Calculate space needed: 8 (discriminator) + 256 (as per contract)
  const space = 8 + 256;
  const rentExemption = await connection.getMinimumBalanceForRentExemption(space);
  
  console.log(`💰 Rent exemption: ${rentExemption / 1e9} SOL`);
  
  // Build initialize instruction
  // Anchor discriminator for "initialize": sha256("global:initialize")[0..8]
  const crypto = await import('crypto');
  const initDiscriminator = crypto.createHash('sha256')
    .update('global:initialize')
    .digest()
    .slice(0, 8);
  
  console.log(`🔑 Initialize discriminator: ${Array.from(initDiscriminator).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}`);
  
  // Create account instruction
  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: leaderboardKeypair.publicKey,
    lamports: rentExemption,
    space: space,
    programId: programId,
  });
  
  // Initialize instruction
  const initializeIx = new TransactionInstruction({
    programId: programId,
    keys: [
      { pubkey: leaderboardKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(initDiscriminator),
  });
  
  // Create transaction
  const tx = new Transaction()
    .add(createAccountIx)
    .add(initializeIx);
  
  try {
    console.log('📤 Sending transaction...');
    const signature = await connection.sendTransaction(tx, [wallet, leaderboardKeypair]);
    console.log(`📝 Transaction signature: ${signature}`);
    
    console.log('⏳ Confirming transaction...');
    await connection.confirmTransaction(signature, 'confirmed');
    
    console.log(`✅ ${exerciseName} leaderboard initialized successfully!`);
    console.log(`📋 Leaderboard address: ${leaderboardKeypair.publicKey.toString()}`);
    
    return leaderboardKeypair.publicKey.toString();
  } catch (error) {
    console.error(`❌ Failed to initialize ${exerciseName} leaderboard:`, error);
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    return null;
  }
}

async function main() {
  console.log('🚀 Initializing Solana Leaderboard Accounts\n');
  console.log(`📡 RPC: ${RPC_URL}`);
  
  const jumpsAddress = await initializeLeaderboard(JUMPS_PROGRAM_ID, 'jumps');
  const pullupsAddress = await initializeLeaderboard(PULLUPS_PROGRAM_ID, 'pullups');
  
  if (jumpsAddress && pullupsAddress) {
    console.log('\n✅ Both leaderboards initialized successfully!\n');
    console.log('📝 Update src/lib/solana/config.ts with these addresses:\n');
    console.log('export const SOLANA_LEADERBOARD_ADDRESSES = {');
    console.log(`  pullups: new PublicKey("${pullupsAddress}"),`);
    console.log(`  jumps: new PublicKey("${jumpsAddress}"),`);
    console.log('} as const;\n');
  } else {
    console.log('\n❌ Failed to initialize leaderboards. Check errors above.');
  }
}

main().catch(console.error);
