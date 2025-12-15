/**
 * Solana Leaderboard Configuration
 * Update these addresses after deploying the exercise-specific contracts
 */

import { Connection, PublicKey } from "@solana/web3.js";
import type { ExerciseType } from "./leaderboard";

// RPC Configuration - CENTRALIZED (DRY Principle)
// 1. Try VITE env var (custom RPC)
// 2. Fallback to public devnet
export const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_DEVNET_RPC_URL || "https://api.devnet.solana.com";

// Shared singleton connection (PERFORMANT Principle)
export const solanaConnection = new Connection(SOLANA_RPC_URL, {
  commitment: "confirmed",
  // 429 Retry logic is handled at the application layer (fetchWithRetry), 
  // but we set a reasonable timeout here
  confirmTransactionInitialTimeout: 60000,
});

// Leaderboard addresses for each exercise (initialized on devnet)
export const SOLANA_LEADERBOARD_ADDRESSES = {
  pullups: new PublicKey("7ohw3tXESGWNNsJwJ2CoNwbgGz9ygjDbUFP23yMeNs76"), // ✅ Initialized leaderboard account
  jumps: new PublicKey("6djmqGnS67Am52V2aEhw9qkNZBMrgCxTf198DjX7KccC"),   // ✅ Initialized leaderboard account
} as const;

/**
 * Get leaderboard address for a specific exercise
 */
export function getLeaderboardAddress(exercise: ExerciseType): PublicKey {
  return SOLANA_LEADERBOARD_ADDRESSES[exercise];
}

/**
 * Check if leaderboard addresses are properly configured
 */
export function areAddressesConfigured(): boolean {
  const placeholderAddress = "11111111111111111111111111111111";
  return (
    SOLANA_LEADERBOARD_ADDRESSES.pullups.toString() !== placeholderAddress &&
    SOLANA_LEADERBOARD_ADDRESSES.jumps.toString() !== placeholderAddress
  );
}

/**
 * Configuration checklist for deployment
 */
export const DEPLOYMENT_CHECKLIST = {
  "1. Deploy SolanaPullupsLeaderboard contract": "✅ Complete - GDSkDgf6Q5mMN5kHZiKTXaAs2CLAkopDRDkSCM1tpcQa",
  "2. Deploy SolanaJumpsLeaderboard contract": "✅ Complete - 7ugCR1KLjHNgUjbW1pZGCadeCHKvUu7NwXsXDTTFypUd",
  "3. Initialize pullups leaderboard account": "✅ Complete - 7ohw3tXESGWNNsJwJ2CoNwbgGz9ygjDbUFP23yMeNs76",
  "4. Initialize jumps leaderboard account": "✅ Complete - 6djmqGnS67Am52V2aEhw9qkNZBMrgCxTf198DjX7KccC",
  "5. Update SOLANA_LEADERBOARD_ADDRESSES.pullups": "✅ Complete - 7ohw3tXESGWNNsJwJ2CoNwbgGz9ygjDbUFP23yMeNs76",
  "6. Update SOLANA_LEADERBOARD_ADDRESSES.jumps": "✅ Complete - 6djmqGnS67Am52V2aEhw9qkNZBMrgCxTf198DjX7KccC",
  "7. Update SOLANA_PULLUPS_PROGRAM_ID in leaderboard.ts": "✅ Complete - GDSkDgf6Q5mMN5kHZiKTXaAs2CLAkopDRDkSCM1tpcQa",
  "8. Update SOLANA_JUMPS_PROGRAM_ID in leaderboard.ts": "✅ Complete - 7ugCR1KLjHNgUjbW1pZGCadeCHKvUu7NwXsXDTTFypUd",
  "9. Test submission flow on devnet": "❌ Pending",
  "10. Verify PDA derivation works correctly": "❌ Pending",
} as const;

export default {
  SOLANA_LEADERBOARD_ADDRESSES,
  getLeaderboardAddress,
  areAddressesConfigured,
  DEPLOYMENT_CHECKLIST,
};