import { Connection, PublicKey } from "@solana/web3.js";
import { SOLANA_LEADERBOARD_PROGRAM_ID } from "./leaderboard";

// Alchemy RPC endpoint for Solana devnet
const ALCHEMY_DEVNET_RPC = "https://solana-devnet.g.alchemy.com/v2/Tx9luktS3qyIwEKVtjnQrpq8t3MNEV-B";

// Cache for leaderboard data (5 min TTL)
interface CachedLeaderboard {
  data: UserScoreOnChain[];
  timestamp: number;
}

interface UserScoreOnChain {
  pubkey: string;
  user: string;
  totalScore: bigint;
  bestSingleScore: bigint;
  pullups: bigint;
  jumps: bigint;
  submissionCount: bigint;
  lastSubmissionTime: bigint;
  firstSubmissionTime: bigint;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let leaderboardCache: CachedLeaderboard | null = null;

/**
 * Deserialize a UserScore account from raw account data
 * Account structure (from Rust program):
 * - user: Pubkey (32 bytes)
 * - total_score: u64 (8 bytes)
 * - best_single_score: u64 (8 bytes)
 * - pullups: u64 (8 bytes)
 * - jumps: u64 (8 bytes)
 * - submission_count: u64 (8 bytes)
 * - last_submission_time: u64 (8 bytes)
 * - first_submission_time: u64 (8 bytes)
 * Total: 8 (discriminator) + 32 + 64 = 104 bytes
 */
function deserializeUserScore(
  data: Buffer,
  pubkey: string
): UserScoreOnChain | null {
  try {
    // Skip 8-byte Anchor discriminator
    let offset = 8;

    if (data.length < offset + 104) {
      console.warn(`Account ${pubkey} too short: ${data.length} bytes`);
      return null;
    }

    // Read user pubkey (32 bytes)
    const userPubkey = new PublicKey(data.slice(offset, offset + 32)).toString();
    offset += 32;

    // Read u64 values (little-endian)
    const totalScore = BigInt(data.readBigUInt64LE(offset));
    offset += 8;

    const bestSingleScore = BigInt(data.readBigUInt64LE(offset));
    offset += 8;

    const pullups = BigInt(data.readBigUInt64LE(offset));
    offset += 8;

    const jumps = BigInt(data.readBigUInt64LE(offset));
    offset += 8;

    const submissionCount = BigInt(data.readBigUInt64LE(offset));
    offset += 8;

    const lastSubmissionTime = BigInt(data.readBigUInt64LE(offset));
    offset += 8;

    const firstSubmissionTime = BigInt(data.readBigUInt64LE(offset));

    return {
      pubkey,
      user: userPubkey,
      totalScore,
      bestSingleScore,
      pullups,
      jumps,
      submissionCount,
      lastSubmissionTime,
      firstSubmissionTime,
    };
  } catch (error) {
    console.error(`Failed to deserialize account ${pubkey}:`, error);
    return null;
  }
}

/**
 * Fetch all UserScore accounts from Solana Leaderboard Program using Alchemy's getProgramAccounts
 * Handles pagination automatically
 */
async function fetchAllUserScoresFromAlchemy(): Promise<UserScoreOnChain[]> {
  const connection = new Connection(ALCHEMY_DEVNET_RPC, "confirmed");

  const allAccounts: UserScoreOnChain[] = [];
  let pageKey: string | undefined;

  try {
    // Keep fetching until no more pageKey
    while (true) {
      const params: any[] = [
        SOLANA_LEADERBOARD_PROGRAM_ID.toString(),
        {
          encoding: "base64",
          withContext: true,
          // pageKey for pagination (if available)
          ...(pageKey && { pageKey }),
        },
      ];

      // Use RPC call directly for getProgramAccounts
      const response = await fetch(ALCHEMY_DEVNET_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getProgramAccounts",
          params,
        }),
      });

      if (!response.ok) {
        throw new Error(`RPC call failed: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(`RPC error: ${json.error.message}`);
      }

      const result = json.result;
      if (!result || !result.value) {
        break;
      }

      // Process accounts
      for (const account of result.value) {
        const data = Buffer.from(account.account.data[0], "base64");
        const parsed = deserializeUserScore(data, account.pubkey);
        if (parsed) {
          allAccounts.push(parsed);
        }
      }

      // Check for pagination
      pageKey = result.pageKey;
      if (!pageKey) {
        break;
      }
    }

    return allAccounts;
  } catch (error) {
    console.error("Error fetching accounts from Alchemy:", error);
    return [];
  }
}

/**
 * Get top N users from Solana leaderboard with caching
 * @param limit Number of top users to return
 * @returns Array of top users sorted by totalScore
 */
export async function getTopUsersFromSolana(
  limit: number = 100
): Promise<UserScoreOnChain[]> {
  // Check cache first
  if (
    leaderboardCache &&
    Date.now() - leaderboardCache.timestamp < CACHE_TTL
  ) {
    return leaderboardCache.data.slice(0, limit);
  }

  // Fetch from Alchemy
  const allAccounts = await fetchAllUserScoresFromAlchemy();

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
