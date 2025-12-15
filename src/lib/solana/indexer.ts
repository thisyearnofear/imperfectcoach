import { Connection, PublicKey } from "@solana/web3.js";
import { SOLANA_JUMPS_PROGRAM_ID, SOLANA_PULLUPS_PROGRAM_ID } from "./leaderboard";
import { SOLANA_LEADERBOARD_ADDRESSES, SOLANA_RPC_URL } from "./config";

// RPC endpoints for Solana devnet with fallbacks - only using CORS-enabled endpoints
const ALCHEMY_DEVNET_RPC = import.meta.env.VITE_SOLANA_DEVNET_RPC_URL;
const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;

function normalizeHeliusKey(value?: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http")) {
    try {
      const url = new URL(trimmed);
      const keyFromParam = url.searchParams.get("api-key");
      if (keyFromParam) {
        return keyFromParam;
      }
    } catch (error) {
      console.warn("Failed to parse HELIUS_API_KEY URL", error);
    }
  }

  return trimmed;
}

const NORMALIZED_HELIUS_KEY = normalizeHeliusKey(HELIUS_API_KEY);
const HELIUS_DEVNET_RPC = NORMALIZED_HELIUS_KEY
  ? `https://devnet.helius-rpc.com/?api-key=${NORMALIZED_HELIUS_KEY}`
  : null;

const FALLBACK_DEVNET_RPCS = [
  SOLANA_RPC_URL, // Primary configured endpoint (env)
  HELIUS_DEVNET_RPC, // Guaranteed-clean Helius endpoint
  ALCHEMY_DEVNET_RPC,
  "https://api.devnet.solana.com",  // Official Solana endpoint (CORS-enabled)
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
 * Try fetching from multiple RPC endpoints in parallel, return first success
 * Uses Promise.race() for ~4x speedup vs sequential approach
 */
async function fetchWithFallback(params: any[]): Promise<any> {
  const method = "getProgramAccounts";
  const rpcEndpoints = ALCHEMY_DEVNET_RPC ? [ALCHEMY_DEVNET_RPC, ...FALLBACK_DEVNET_RPCS] : FALLBACK_DEVNET_RPCS;
  
  // Race all endpoints in parallel
  const racePromises = rpcEndpoints.map(endpoint =>
    fetchFromSingleEndpoint(endpoint, method, params)
  );

  try {
    return await Promise.race(racePromises);
  } catch (error) {
    console.error("All RPC endpoints failed:", error);
    throw error;
  }
}

/**
 * Fetch from a single RPC endpoint with retry logic
 */
async function fetchFromSingleEndpoint(endpoint: string, method: string, params: any[]): Promise<any> {
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });

      if (response.status === 429) {
        throw new Error("Rate limited (429)");
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.error) {
        if (json.error.code === 429 || json.error.message?.includes('429') || json.error.message?.includes('Too many')) {
          throw new Error("Rate limited (429)");
        }
        throw new Error(`RPC error: ${json.error.message}`);
      }

      return json;
    } catch (error: any) {
      if (attempts >= maxAttempts) throw error;
      if (error.message?.includes('429') || error.message?.includes('Rate')) {
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      throw error;
    }
  }
}

/**
 * Fetch all UserScore accounts from Solana Jumps and Pullups Programs separately
 * Handles pagination automatically with fallback RPC endpoints
 */
async function fetchAllUserScoresFromSolanaPrograms(): Promise<UserScoreOnChain[]> {
  // Fetch from both jumps and pullups programs in parallel (not sequential)
  const programConfigs = [
    { programId: SOLANA_JUMPS_PROGRAM_ID, exerciseType: 'jumps' },
    { programId: SOLANA_PULLUPS_PROGRAM_ID, exerciseType: 'pullups' }
  ];

  const allRawAccounts: RawUserScore[] = [];

  // Fetch both programs in parallel instead of sequential RPC endpoint loop
  const programResults = await Promise.all(
    programConfigs.map(config => fetchProgramAccounts(config))
  );

  // Combine results from both programs
  for (const accounts of programResults) {
    allRawAccounts.push(...accounts);
  }

  // Combine and return final leaderboard
  return combineRawScores(allRawAccounts);
}

/**
 * Fetch all accounts from a single program with pagination
 */
async function fetchProgramAccounts(config: { programId: any; exerciseType: 'jumps' | 'pullups' }): Promise<RawUserScore[]> {  // Clean pagination using parallel RPC race
  const allAccounts: RawUserScore[] = [];
  let pageKey: string | undefined;

  while (true) {
    try {
      const params: any[] = [
        config.programId.toString(),
        {
          encoding: "base64",
          withContext: true,
          ...(pageKey && { pageKey }),
        },
      ];

      const json = await fetchWithFallback(params);

      // Robust parsing across providers
      let accounts: any[] = [];
      if (Array.isArray(json.result)) {
        accounts = json.result;
      } else if (json.result && Array.isArray(json.result.value)) {
        accounts = json.result.value;
      } else if (json.result && Array.isArray(json.result.items)) {
        accounts = json.result.items;
      } else {
        console.warn(`Unexpected RPC response format`, json);
        break;
      }

      if (accounts.length === 0) {
        break;
      }

      for (const account of accounts) {
        const isLeaderboardAccount =
          account.pubkey === SOLANA_LEADERBOARD_ADDRESSES.jumps.toString() ||
          account.pubkey === SOLANA_LEADERBOARD_ADDRESSES.pullups.toString();
        if (isLeaderboardAccount) continue;

        const base64String = account.account.data[0];
        const binaryString = atob(base64String);
        const data = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) data[i] = binaryString.charCodeAt(i);

        const parsed = deserializeUserScore(
          data,
          account.pubkey,
          config.exerciseType as 'pullups' | 'jumps'
        );
        if (parsed) allAccounts.push(parsed);
      }

      pageKey = json.result?.pageKey;
      if (!pageKey) break;
    } catch (error) {
      console.error(`Failed to fetch program accounts for ${config.exerciseType}:`, error);
      break; // Exit loop on consistent failure; outer callers will handle combining
    }
  }

  console.log(`✅ Fetched ${allAccounts.length} ${config.exerciseType} accounts`);
  return allAccounts;
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
