/**
 * Solana Leaderboard Configuration
 * Update these addresses after deploying the exercise-specific contracts
 */

import { PublicKey } from "@solana/web3.js";
import type { ExerciseType } from "./leaderboard";

// Leaderboard addresses for each exercise (update after deployment)
export const SOLANA_LEADERBOARD_ADDRESSES = {
  pullups: new PublicKey("GDSkDgf6Q5mMN5kHZiKTXaAs2CLAkopDRDkSCM1tpcQa"), // ✅ Deployed pullups program ID
  jumps: new PublicKey("7ugCR1KLjHNgUjbW1pZGCadeCHKvUu7NwXsXDTTFypUd"),   // ✅ Deployed jumps program ID
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
  "3. Update SOLANA_LEADERBOARD_ADDRESSES.pullups": "✅ Complete - GDSkDgf6Q5mMN5kHZiKTXaAs2CLAkopDRDkSCM1tpcQa",
  "4. Update SOLANA_LEADERBOARD_ADDRESSES.jumps": "✅ Complete - 7ugCR1KLjHNgUjbW1pZGCadeCHKvUu7NwXsXDTTFypUd",
  "5. Update SOLANA_PULLUPS_PROGRAM_ID in leaderboard.ts": "✅ Complete - GDSkDgf6Q5mMN5kHZiKTXaAs2CLAkopDRDkSCM1tpcQa",
  "6. Update SOLANA_JUMPS_PROGRAM_ID in leaderboard.ts": "✅ Complete - 7ugCR1KLjHNgUjbW1pZGCadeCHKvUu7NwXsXDTTFypUd",
  "7. Test submission flow on devnet": "❌ Pending",
  "8. Verify PDA derivation works correctly": "❌ Pending",
} as const;

export default {
  SOLANA_LEADERBOARD_ADDRESSES,
  getLeaderboardAddress,
  areAddressesConfigured,
  DEPLOYMENT_CHECKLIST,
};