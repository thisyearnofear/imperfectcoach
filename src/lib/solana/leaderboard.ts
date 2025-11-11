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

// Solana Program IDs (deploy these separately)
export const SOLANA_PULLUPS_PROGRAM_ID = new PublicKey(
  "GDSkDgf6Q5mMN5kHZiKTXaAs2CLAkopDRDkSCM1tpcQa" // ✅ Deployed pullups program ID
);

export const SOLANA_JUMPS_PROGRAM_ID = new PublicKey(
  "7ugCR1KLjHNgUjbW1pZGCadeCHKvUu7NwXsXDTTFypUd" // ✅ Deployed jumps program ID
);

// Exercise type enum for type safety
export type ExerciseType = "pullups" | "jumps";

// Common IDL structure for both exercise-specific programs
const createExerciseIDL = (exerciseName: string, programName: string) => ({
  version: "0.1.0",
  name: programName,
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "leaderboard", isMut: true, isSigner: true },
        { name: "owner", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
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
        { name: "score", type: "u32" }, // Single score parameter
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
});

// Exercise-specific IDLs
export const SOLANA_PULLUPS_IDL = createExerciseIDL("pullups", "solana_pullups_leaderboard");
export const SOLANA_JUMPS_IDL = createExerciseIDL("jumps", "solana_jumps_leaderboard");

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

// Exercise-specific score structure
export interface SolanaExerciseScoreEntry {
  user: string;
  exercise: ExerciseType;
  totalScore: bigint;
  bestSingleScore: bigint;
  submissionCount: bigint;
  lastSubmissionTime: bigint;
  firstSubmissionTime: bigint;
}

// Legacy interface for backward compatibility (will be deprecated)
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
 * Get the program ID for a specific exercise
 */
export function getExerciseProgramId(exercise: ExerciseType): PublicKey {
  switch (exercise) {
    case "pullups":
      return SOLANA_PULLUPS_PROGRAM_ID;
    case "jumps":
      return SOLANA_JUMPS_PROGRAM_ID;
    default:
      throw new Error(`Unknown exercise type: ${exercise}`);
  }
}

/**
 * Get the IDL for a specific exercise
 */
export function getExerciseIDL(exercise: ExerciseType) {
  switch (exercise) {
    case "pullups":
      return SOLANA_PULLUPS_IDL;
    case "jumps":
      return SOLANA_JUMPS_IDL;
    default:
      throw new Error(`Unknown exercise type: ${exercise}`);
  }
}

/**
 * Derive user score PDA for a given user and exercise
 */
export function getUserScorePDA(
  userPublicKey: PublicKey,
  leaderboardPublicKey: PublicKey,
  exercise: ExerciseType
): [PublicKey, number] {
  const programId = getExerciseProgramId(exercise);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_score"), leaderboardPublicKey.toBuffer(), userPublicKey.toBuffer()],
    programId
  );
}

/**
 * Build instruction for submitScore instruction
 * This creates the raw instruction without Anchor dependency for exercise-specific contracts
 */
function buildSubmitScoreInstruction(
  leaderboardAddress: PublicKey,
  userScorePda: PublicKey,
  userPublicKey: PublicKey,
  score: number,
  exercise: ExerciseType
): TransactionInstruction {
  const programId = getExerciseProgramId(exercise);
  
  // Encode instruction data (submitScore discriminator + args)
  // Discriminator is first 8 bytes of SHA256 hash of "global:submitScore"
  const discriminator = Buffer.from([0xe0, 0x2a, 0x17, 0x1b, 0xd1, 0x4b, 0xc6, 0x64]); // Example - replace with actual
  
  // Encode single score as u32 (4 bytes, little-endian)
  const scoreBuf = Buffer.alloc(4);
  scoreBuf.writeUInt32LE(score, 0);

  const instructionData = Buffer.concat([discriminator, scoreBuf]);

  return new TransactionInstruction({
    programId,
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
 * Submit a score to Solana Exercise-Specific Program
 * @param connection Solana RPC connection
 * @param wallet Connected wallet
 * @param leaderboardAddress Public key of leaderboard account for the specific exercise
 * @param score Score for the exercise (pullups count or jumps count)
 * @param exercise Exercise type ("pullups" or "jumps")
 * @returns Transaction signature
 */
export async function submitScoreToSolana(
  connection: Connection,
  wallet: WalletContextState,
  leaderboardAddress: PublicKey,
  score: number,
  exercise: ExerciseType
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected or does not support signing");
  }

  // Derive user score PDA for this specific exercise
  const [userScorePda] = getUserScorePDA(
    wallet.publicKey,
    leaderboardAddress,
    exercise
  );

  try {
    // Build the instruction for the specific exercise contract
    const instruction = buildSubmitScoreInstruction(
      leaderboardAddress,
      userScorePda,
      wallet.publicKey,
      score,
      exercise
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
    console.error(`Error submitting ${exercise} score to Solana:`, error);
    throw error;
  }
}

/**
 * Get user's score from Solana exercise-specific leaderboard
 * @param connection Solana RPC connection
 * @param userPublicKey User's wallet public key
 * @param leaderboardAddress Leaderboard address for the specific exercise
 * @param exercise Exercise type ("pullups" or "jumps")
 * @returns User's score data for the specific exercise
 */
export async function getUserScoreFromSolana(
  connection: Connection,
  userPublicKey: PublicKey,
  leaderboardAddress: PublicKey,
  exercise: ExerciseType
): Promise<SolanaExerciseScoreEntry | null> {
  try {
    // Get user score PDA for this exercise
    const [userScorePda] = getUserScorePDA(userPublicKey, leaderboardAddress, exercise);
    
    const accountInfo = await connection.getAccountInfo(userScorePda);
    if (!accountInfo) return null;

    // Parse account data (this would need proper anchor deserialization)
    // For now, return null - will be enhanced with proper IDL parsing
    // TODO: Implement proper account deserialization based on UserScore struct
    return null;
  } catch (error) {
    console.error(`Error fetching user ${exercise} score from Solana:`, error);
    return null;
  }
}

/**
 * Get combined user scores for both exercises
 * @param connection Solana RPC connection  
 * @param userPublicKey User's wallet public key
 * @param pullupsLeaderboardAddress Pullups leaderboard address
 * @param jumpsLeaderboardAddress Jumps leaderboard address
 * @returns Combined score data from both exercise contracts
 */
export async function getUserCombinedScores(
  connection: Connection,
  userPublicKey: PublicKey,
  pullupsLeaderboardAddress: PublicKey,
  jumpsLeaderboardAddress: PublicKey
): Promise<{ pullups: SolanaExerciseScoreEntry | null; jumps: SolanaExerciseScoreEntry | null }> {
  const [pullups, jumps] = await Promise.all([
    getUserScoreFromSolana(connection, userPublicKey, pullupsLeaderboardAddress, "pullups"),
    getUserScoreFromSolana(connection, userPublicKey, jumpsLeaderboardAddress, "jumps")
  ]);

  return { pullups, jumps };
}

/**
 * Get leaderboard stats from Solana exercise-specific program
 * @param connection Solana RPC connection
 * @param leaderboardAddress Public key of leaderboard account
 * @param exercise Exercise type
 */
export async function getSolanaLeaderboardStats(
  connection: Connection,
  leaderboardAddress: PublicKey,
  exercise: ExerciseType
) {
  try {
    const accountInfo = await connection.getAccountInfo(leaderboardAddress);
    if (!accountInfo) return null;

    // Parse account data
    // For now, return null - will be enhanced with proper IDL parsing
    // TODO: Implement proper account deserialization based on Leaderboard struct
    return null;
  } catch (error) {
    console.error(`Error fetching Solana ${exercise} leaderboard stats:`, error);
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
