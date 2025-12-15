import { Connection, PublicKey } from "@solana/web3.js";
import { SOLANA_JUMPS_PROGRAM_ID, SOLANA_PULLUPS_PROGRAM_ID } from "./leaderboard";
import { SOLANA_LEADERBOARD_ADDRESSES } from "./config";

// RPC endpoints for Solana devnet with fallbacks - only using CORS-enabled endpoints
const ALCHEMY_DEVNET_RPC = import.meta.env.VITE_SOLANA_DEVNET_RPC_URL;
const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const FALLBACK_DEVNET_RPCS = [
  "https://api.devnet.solana.com",  // Official Solana endpoint (CORS-enabled)
  HELIUS_API_KEY ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}` : null,  // Helius endpoint with API key
  "https://devnet.sonic.game",      // Sonic devnet as additional fallback
].filter(Boolean); // Remove null entries

// Cache for leaderboard data (5 min TTL)
interface CachedLeaderboard {
  data: UserScoreOnChain[];
  timestamp: number;
}

// Interface for internal processing - each record represents one exercise submission
interface RawUserScore {
  pubkey: string;
  user: string;
  totalScore: bigint;
  bestSingleScore: bigint;
  exerciseType: 'pullups' | 'jumps'; // Added to distinguish between exercise types
  submissionCount: bigint;
  lastSubmissionTime: bigint;
  firstSubmissionTime: bigint;
}

// Interface for the final combined result
interface UserScoreOnChain {
  pubkey: string;
  user: string;
  totalScore: bigint;
  bestSingleScore: bigint;
  pullups: bigint;  // Total pullups for this user
  jumps: bigint;    // Total jumps for this user
  submissionCount: bigint;
  lastSubmissionTime: bigint;
  firstSubmissionTime: bigint;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let leaderboardCache: CachedLeaderboard | null = null;

/**
 * Deserialize a UserScore account from raw account data
 * Account structure (from Rust program) - this may vary for each exercise type
 * - user: Pubkey (32 bytes)
 * - total_score: u64 (8 bytes)
 * - best_single_score: u64 (8 bytes)
 * - submission_count: u64 (8 bytes)
 * - last_submission_time: u64 (8 bytes)
 * - first_submission_time: u64 (8 bytes)
 */
function deserializeUserScore(
  data: Uint8Array,
  pubkey: string,
  exerciseType: 'pullups' | 'jumps' // Specify which program this is for
): RawUserScore | null {
  try {
    // Skip 8-byte Anchor discriminator
    let offset = 8;

    // Adjust expected size based on actual account structure
    // For exercise-specific accounts, the structure might be different
    // This is an estimated size - adjust based on your actual on-chain structure
    if (data.length < offset + 88) { // Reduced expected size for exercise-specific accounts
      console.warn(`Account ${pubkey} too short: ${data.length} bytes for ${exerciseType} program`);
      return null;
    }

    // Read user pubkey (32 bytes)
    const userPubkey = new PublicKey(data.slice(offset, offset + 32)).toString();
    offset += 32;

    // Use DataView for browser-compatible u64 reading (little-endian)
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    const totalScore = view.getBigUint64(offset, true); // true = little-endian
    offset += 8;

    const bestSingleScore = view.getBigUint64(offset, true);
    offset += 8;

    // For exercise-specific programs, this might just be the count for that exercise
    // Adjust these based on your actual on-chain account structure
    const submissionCount = view.getBigUint64(offset, true);
    offset += 8;

    const lastSubmissionTime = view.getBigUint64(offset, true);
    offset += 8;

    const firstSubmissionTime = view.getBigUint64(offset, true);

    return {
      pubkey,
      user: userPubkey,
      totalScore,
      bestSingleScore,
      exerciseType, // This helps us know which exercise this data is for
      submissionCount,
      lastSubmissionTime,
      firstSubmissionTime,
    };
  } catch (error) {
    console.error(`Failed to deserialize ${exerciseType} account ${pubkey}:`, error);
    return null;
  }
}

/**
 * Combine raw scores from separate pullups and jumps programs into unified UserScoreOnChain format
 * This aggregates scores for the same user across both exercise types
 */
function combineRawScores(rawScores: RawUserScore[]): UserScoreOnChain[] {
  const userMap = new Map<string, UserScoreOnChain>();

  for (const score of rawScores) {
    // Get or create a unified entry for this user
    let userEntry = userMap.get(score.user);
    if (!userEntry) {
      userEntry = {
        pubkey: score.pubkey, // Use the pubkey from the first record found
        user: score.user,
        totalScore: 0n,
        bestSingleScore: 0n,
        pullups: 0n,
        jumps: 0n,
        submissionCount: 0n,
        lastSubmissionTime: 0n,
        firstSubmissionTime: 0n,
      };
    }

    // Update the unified entry based on the exercise type
    if (score.exerciseType === 'pullups') {
      userEntry.pullups = score.totalScore; // Assuming totalScore represents pullup count
    } else if (score.exerciseType === 'jumps') {
      userEntry.jumps = score.totalScore; // Assuming totalScore represents jump count
    }

    // Update other fields as appropriate
    userEntry.totalScore = userEntry.pullups + userEntry.jumps;
    userEntry.submissionCount += score.submissionCount;
    userEntry.bestSingleScore = score.bestSingleScore > userEntry.bestSingleScore ?
      score.bestSingleScore : userEntry.bestSingleScore;
    userEntry.lastSubmissionTime = score.lastSubmissionTime > userEntry.lastSubmissionTime ?
      score.lastSubmissionTime : userEntry.lastSubmissionTime;
    userEntry.firstSubmissionTime = userEntry.firstSubmissionTime === 0n ?
      score.firstSubmissionTime : userEntry.firstSubmissionTime;

    userMap.set(score.user, userEntry);
  }

  return Array.from(userMap.values());
}

/**
 * Try fetching from multiple RPC endpoints with fallback
 * Uses getProgramAccountsV2 for Helius endpoints to handle large datasets
 */
async function fetchWithFallback(endpoint: string, params: any[]): Promise<any> {
  // Use getProgramAccountsV2 for Helius to handle large datasets
  const isHelius = endpoint.includes('helius');
  const method = isHelius ? "getProgramAccountsV2" : "getProgramAccounts";

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method,
          params,
        }),
      });

      if (response.status === 429) {
        console.warn(`RPC 429 Rate Limit on ${endpoint}. Retrying... (${attempts}/${maxAttempts})`);
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts - 1)));
        continue;
      }

      if (!response.ok) {
        throw new Error(`RPC call failed: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.error) {
        // If error is related to rate limiting (some RPCs return 200 with error body)
        if (json.error.code === 429 || json.error.message?.includes('429') || json.error.message?.includes('Too many requests')) {
          console.warn(`RPC JSON 429 on ${endpoint}. Retrying... (${attempts}/${maxAttempts})`);
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts - 1)));
          continue;
        }
        throw new Error(`RPC error: ${json.error.message}`);
      }

      return json;

    } catch (error: any) {
      // If network error, maybe retry? For now only retry explicit rate limits or just fail to next endpoint
      if (attempts >= maxAttempts) throw error;
      // If it's a rate limit error caught, retry
      if (error.message?.includes('429')) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts - 1)));
        continue;
      }
      throw error; // Other errors fail immediately to try next endpoint
    }
  }
}

/**
 * Fetch all UserScore accounts from Solana Jumps and Pullups Programs separately
 * Handles pagination automatically with fallback RPC endpoints
 */
async function fetchAllUserScoresFromSolanaPrograms(): Promise<UserScoreOnChain[]> {
  // We need to fetch from both jumps and pullups programs separately
  const programConfigs = [
    { programId: SOLANA_JUMPS_PROGRAM_ID, exerciseType: 'jumps' },
    { programId: SOLANA_PULLUPS_PROGRAM_ID, exerciseType: 'pullups' }
  ];

  const allRawAccounts: RawUserScore[] = [];
  const rpcEndpoints = ALCHEMY_DEVNET_RPC ? [ALCHEMY_DEVNET_RPC, ...FALLBACK_DEVNET_RPCS] : FALLBACK_DEVNET_RPCS;

  for (const endpoint of rpcEndpoints) {
    let hasAnySuccess = false;

    for (const config of programConfigs) {
      let pageKey: string | undefined;

      try {
        const endpointName = endpoint.includes('alchemy') ? 'Alchemy' :
          endpoint.includes('helius') ? 'Helius' :
            endpoint.includes('solana') ? 'Solana Devnet' :
              endpoint.includes('sonic') ? 'Sonic' : 'Custom RPC';
        console.log(`Trying ${config.exerciseType} program on RPC endpoint: ${endpointName}`);

        // Fetch from this program with pagination
        while (true) {
          const params: any[] = [
            config.programId.toString(),
            {
              encoding: "base64",
              withContext: true,
              // pageKey for pagination (if available)
              ...(pageKey && { pageKey }),
            },
          ];

          const json = await fetchWithFallback(endpoint, params);
          const result = json.result;

          if (!result || !result.value) {
            break;
          }

          // Process accounts - add them to our unified structure
          for (const account of result.value) {
            // Skip the leaderboard accounts themselves (they have different structure)
            const isLeaderboardAccount =
              account.pubkey === SOLANA_LEADERBOARD_ADDRESSES.jumps.toString() ||
              account.pubkey === SOLANA_LEADERBOARD_ADDRESSES.pullups.toString();

            if (isLeaderboardAccount) {
              continue; // Skip leaderboard accounts, only process user score PDAs
            }

            // Use browser-compatible base64 decoding
            const base64String = account.account.data[0];
            const binaryString = atob(base64String);
            const data = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              data[i] = binaryString.charCodeAt(i);
            }
            // This will create an entry for this exercise type
            const parsed = deserializeUserScore(data, account.pubkey, config.exerciseType as 'pullups' | 'jumps');
            if (parsed) {
              allRawAccounts.push(parsed);
            }
          }

          // Check for pagination
          pageKey = result.pageKey;
          if (!pageKey) {
            break;
          }
        }

        hasAnySuccess = true;
        const successEndpointName = endpoint.includes('alchemy') ? 'Alchemy' :
          endpoint.includes('helius') ? 'Helius' :
            endpoint.includes('solana') ? 'Solana Devnet' :
              endpoint.includes('sonic') ? 'Sonic' : 'Custom RPC';
        console.log(`✅ Successfully fetched accounts from ${config.exerciseType} program on ${successEndpointName}`);

      } catch (error) {
        const errorEndpointName = endpoint.includes('alchemy') ? 'Alchemy' :
          endpoint.includes('helius') ? 'Helius' :
            endpoint.includes('solana') ? 'Solana Devnet' :
              endpoint.includes('sonic') ? 'Sonic' : 'Custom RPC';
        console.error(`❌ Failed to fetch from ${config.exerciseType} program on ${errorEndpointName}:`, error);
        // Continue to next program
        continue;
      }
    }

    if (hasAnySuccess) {
      // If we successfully fetched from at least one program on this endpoint, combine and return results
      const combinedAccounts = combineRawScores(allRawAccounts);
      console.log(`✅ Successfully fetched and combined ${combinedAccounts.length} total accounts from Solana programs`);
      return combinedAccounts;
    }
  }

  // If all endpoints and programs failed, return empty array
  console.error("❌ All RPC endpoints and Solana programs failed");
  return [];
}

/**
 * Get top N users from Solana leaderboard with caching and error handling
 * @param limit Number of top users to return
 * @returns Array of top users sorted by totalScore
 */
export async function getTopUsersFromSolana(
  limit: number = 100
): Promise<UserScoreOnChain[]> {
  try {
    // Check cache first
    if (
      leaderboardCache &&
      Date.now() - leaderboardCache.timestamp < CACHE_TTL
    ) {
      return leaderboardCache.data.slice(0, limit);
    }

    // Fetch from RPC endpoints - fetch from both Solana programs
    const allAccounts = await fetchAllUserScoresFromSolanaPrograms();

    // Sort by totalScore (descending)
    allAccounts.sort((a, b) => {
      if (b.totalScore > a.totalScore) return 1;
      if (b.totalScore < a.totalScore) return -1;
      return 0;
    });

    // Update cache
    leaderboardCache = {
      data: allAccounts,
      timestamp: Date.now(),
    };

    return allAccounts.slice(0, limit);
  } catch (error) {
    console.error("❌ Error in getTopUsersFromSolana:", error);
    // Return empty array to prevent NaN errors in the UI
    return [];
  }
}

/**
 * Get a specific user's score from the leaderboard
 */
export function getUserScoreFromCache(
  userPubkey: string
): UserScoreOnChain | null {
  if (!leaderboardCache) {
    return null;
  }

  return (
    leaderboardCache.data.find((entry) => entry.user === userPubkey) || null
  );
}

/**
 * Clear cache manually (useful for testing)
 */
export function clearLeaderboardCache(): void {
  leaderboardCache = null;
}
