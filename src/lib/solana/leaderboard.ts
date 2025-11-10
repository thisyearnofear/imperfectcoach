import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import {
  WalletContextState,
} from "@solana/wallet-adapter-react";

// Solana Leaderboard Program ID (deployed on devnet)
export const SOLANA_LEADERBOARD_PROGRAM_ID = new PublicKey(
  "7cPFKHTiWLqAUtpYWdGQSt5G7WkdUpJVPRrcDFKM3QHC"
);

// ABI/IDL for Solana Leaderboard Program
export const SOLANA_LEADERBOARD_IDL = {
  version: "0.1.0",
  name: "solana_leaderboard",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "leaderboard", isMut: true, isSigner: true },
        { name: "owner", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "exerciseName", type: "string" }],
    },
    {
      name: "submitScore",
      accounts: [
        { name: "leaderboard", isMut: true, isSigner: false },
        { name: "userScore", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "pullups", type: "u32" },
        { name: "jumps", type: "u32" },
      ],
    },
    {
      name: "getUserScore",
      accounts: [{ name: "userScore", isMut: false, isSigner: false }],
      args: [],
    },
    {
      name: "getStats",
      accounts: [{ name: "leaderboard", isMut: false, isSigner: false }],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Leaderboard",
      fields: [
        { name: "exerciseName", type: "string" },
        { name: "totalParticipants", type: "u64" },
        { name: "totalSubmissions", type: "u64" },
      ],
    },
    {
      name: "UserScore",
      fields: [
        { name: "user", type: "publicKey" },
        { name: "totalScore", type: "u64" },
        { name: "bestSingleScore", type: "u64" },
        { name: "pullups", type: "u64" },
        { name: "jumps", type: "u64" },
        { name: "submissionCount", type: "u64" },
        { name: "lastSubmissionTime", type: "u64" },
        { name: "firstSubmissionTime", type: "u64" },
      ],
    },
  ],
  events: [
    {
      name: "ScoreSubmitted",
      fields: [
        { name: "user", type: "publicKey" },
        { name: "scoreAdded", type: "u64" },
        { name: "newTotalScore", type: "u64" },
        { name: "newBestScore", type: "u64" },
        { name: "timestamp", type: "u64" },
      ],
    },
  ],
};

// Unified score entry structure
export interface UnifiedLeaderboardEntry {
  user: string; // Solana pubkey or Ethereum address
  chain: "base" | "solana";
  pullups: number;
  jumps: number;
  totalScore: bigint;
  bestSingleScore: bigint;
  submissionCount: bigint;
  lastSubmissionTime: bigint;
}

// Solana-specific score structure
export interface SolanaScoreEntry {
  user: string;
  totalScore: bigint;
  bestSingleScore: bigint;
  pullups: bigint;
  jumps: bigint;
  submissionCount: bigint;
  lastSubmissionTime: bigint;
  firstSubmissionTime: bigint;
}

/**
 * Derive user score PDA for a given user
 */
export function getUserScorePDA(
  userPublicKey: PublicKey,
  programId: PublicKey = SOLANA_LEADERBOARD_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_score"), userPublicKey.toBuffer()],
    programId
  );
}

/**
 * Build instruction for submitScore instruction
 * This creates the raw instruction without Anchor dependency
 */
function buildSubmitScoreInstruction(
  leaderboardAddress: PublicKey,
  userScorePda: PublicKey,
  userPublicKey: PublicKey,
  pullups: number,
  jumps: number
): TransactionInstruction {
  // Encode instruction data (submitScore discriminator + args)
  // Discriminator is first 8 bytes of SHA256 hash of "global:submitScore"
  const discriminator = Buffer.from([0xe0, 0x2a, 0x17, 0x1b, 0xd1, 0x4b, 0xc6, 0x64]); // Example - replace with actual
  
  // Encode pullups and jumps as u32 (4 bytes each, little-endian)
  const pullupsBuf = Buffer.alloc(4);
  pullupsBuf.writeUInt32LE(pullups, 0);
  
  const jumpsBuf = Buffer.alloc(4);
  jumpsBuf.writeUInt32LE(jumps, 0);

  const instructionData = Buffer.concat([discriminator, pullupsBuf, jumpsBuf]);

  return new TransactionInstruction({
    programId: SOLANA_LEADERBOARD_PROGRAM_ID,
    keys: [
      { pubkey: leaderboardAddress, isSigner: false, isWritable: true },
      { pubkey: userScorePda, isSigner: false, isWritable: true },
      { pubkey: userPublicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });
}

/**
 * Submit a score to Solana Leaderboard Program
 * Note: Requires the actual program deployment on-chain
 * @param connection Solana RPC connection
 * @param wallet Connected wallet
 * @param leaderboardAddress Public key of leaderboard account
 * @param pullups Number of pullups
 * @param jumps Number of jumps
 * @returns Transaction signature
 */
export async function submitScoreToSolana(
  connection: Connection,
  wallet: WalletContextState,
  leaderboardAddress: PublicKey,
  pullups: number,
  jumps: number,
  programId: PublicKey = SOLANA_LEADERBOARD_PROGRAM_ID
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected or does not support signing");
  }

  // Derive user score PDA
  const [userScorePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_score"), wallet.publicKey.toBuffer()],
    programId
  );

  try {
    // Build the instruction
    const instruction = buildSubmitScoreInstruction(
      leaderboardAddress,
      userScorePda,
      wallet.publicKey,
      pullups,
      jumps
    );

    // Create and send transaction
    const latestBlockhash = await connection.getLatestBlockhash();
    const transaction = new Transaction({
      feePayer: wallet.publicKey,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }).add(instruction);

    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    
    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    return signature;
  } catch (error) {
    console.error("Error submitting score to Solana:", error);
    throw error;
  }
}

/**
 * Get user's score from Solana leaderboard
 * @param connection Solana RPC connection
 * @param userScoreAddress Public key of user score account
 * @returns User's score data
 */
export async function getUserScoreFromSolana(
  connection: Connection,
  userScoreAddress: PublicKey,
  programId: PublicKey = SOLANA_LEADERBOARD_PROGRAM_ID
): Promise<SolanaScoreEntry | null> {
  try {
    const accountInfo = await connection.getAccountInfo(userScoreAddress);
    if (!accountInfo) return null;

    // Parse account data (this would need proper anchor deserialization)
    // For now, return null - will be enhanced with proper IDL parsing
    return null;
  } catch (error) {
    console.error("Error fetching user score from Solana:", error);
    return null;
  }
}

/**
 * Get leaderboard stats from Solana
 * @param connection Solana RPC connection
 * @param leaderboardAddress Public key of leaderboard account
 */
export async function getSolanaLeaderboardStats(
  connection: Connection,
  leaderboardAddress: PublicKey,
  programId: PublicKey = SOLANA_LEADERBOARD_PROGRAM_ID
) {
  try {
    const accountInfo = await connection.getAccountInfo(leaderboardAddress);
    if (!accountInfo) return null;

    // Parse account data
    // For now, return null - will be enhanced with proper IDL parsing
    return null;
  } catch (error) {
    console.error("Error fetching Solana leaderboard stats:", error);
    return null;
  }
}

/**
 * Get top users from Solana leaderboard
 * Uses Alchemy's getProgramAccounts with pagination for efficient querying
 * Results are cached for 5 minutes
 * @param limit Number of top users to fetch
 */
export async function getTopUsersFromSolana(
  limit: number = 100
): Promise<UnifiedLeaderboardEntry[]> {
  try {
    // Import here to avoid circular dependency
    const { getTopUsersFromSolana: getFromIndexer } = await import("./indexer");
    
    const accounts = await getFromIndexer(limit);
    
    // Convert to UnifiedLeaderboardEntry format
    return accounts.map((account) => ({
      user: account.user,
      chain: "solana",
      pullups: Number(account.pullups),
      jumps: Number(account.jumps),
      totalScore: account.totalScore,
      bestSingleScore: account.bestSingleScore,
      submissionCount: account.submissionCount,
      lastSubmissionTime: account.lastSubmissionTime,
    }));
  } catch (error) {
    console.error("Error fetching top users from Solana:", error);
    return [];
  }
}

/**
 * Convert Solana score entry to unified format
 */
export function solanaToUnified(entry: SolanaScoreEntry): UnifiedLeaderboardEntry {
  return {
    user: entry.user,
    chain: "solana",
    pullups: Number(entry.pullups),
    jumps: Number(entry.jumps),
    totalScore: entry.totalScore,
    bestSingleScore: entry.bestSingleScore,
    submissionCount: entry.submissionCount,
    lastSubmissionTime: entry.lastSubmissionTime,
  };
}
