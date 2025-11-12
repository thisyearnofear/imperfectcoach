import { ContractConfig } from "./types";
import { PublicKey } from "@solana/web3.js";

export const IMPERFECT_COACH_PASSPORT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "achievement",
        type: "uint256",
      },
    ],
    name: "AchievementUnlocked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "CoachOperatorSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "PassportMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint32",
            name: "level",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "totalPullups",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "totalJumps",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "pullupPersonalBest",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "jumpPersonalBest",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "currentStreak",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "longestStreak",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "lastWorkoutDay",
            type: "uint32",
          },
          {
            internalType: "uint64",
            name: "totalWorkoutSessions",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "firstWorkoutTimestamp",
            type: "uint64",
          },
        ],
        indexed: false,
        internalType: "struct ImperfectCoachPassport.PassportData",
        name: "data",
        type: "tuple",
      },
    ],
    name: "PassportUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "newStreak",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "streakBroken",
        type: "bool",
      },
    ],
    name: "StreakUpdated",
    type: "event",
  },
  {
    inputs: [],
    name: "CENTURY_PULLUPS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "CONSISTENT_ATHLETE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "FIRST_WORKOUT",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "LEVEL_10",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MONTH_STREAK",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "THOUSAND_JUMPS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "WEEK_STREAK",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "coachOperator",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getAchievements",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getPassportData",
    outputs: [
      {
        components: [
          {
            internalType: "uint32",
            name: "level",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "totalPullups",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "totalJumps",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "pullupPersonalBest",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "jumpPersonalBest",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "currentStreak",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "longestStreak",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "lastWorkoutDay",
            type: "uint32",
          },
          {
            internalType: "uint64",
            name: "totalWorkoutSessions",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "firstWorkoutTimestamp",
            type: "uint64",
          },
        ],
        internalType: "struct ImperfectCoachPassport.PassportData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "getTokenId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "achievement",
        type: "uint256",
      },
    ],
    name: "hasAchievement",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_operator",
        type: "address",
      },
    ],
    name: "setCoachOperator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint32",
        name: "level",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "totalPullups",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "totalJumps",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "pullupPersonalBest",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "jumpPersonalBest",
        type: "uint32",
      },
      {
        internalType: "bool",
        name: "isNewWorkout",
        type: "bool",
      },
    ],
    name: "updatePassport",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const IMPERFECT_COACH_PASSPORT_CONFIG: ContractConfig = {
  address: "0x7c95712a2bce65e723cE99C190f6bd6ff73c4212",
  abi: IMPERFECT_COACH_PASSPORT_ABI,
};

// ExerciseLeaderboard ABI for individual exercise leaderboards
export const EXERCISE_LEADERBOARD_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_exerciseName", type: "string" },
      { internalType: "address", name: "_initialOperator", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint32", name: "score", type: "uint32" },
    ],
    name: "addScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "count", type: "uint256" }],
    name: "getTopUsers",
    outputs: [
      {
        components: [
          { internalType: "address", name: "user", type: "address" },
          { internalType: "uint256", name: "totalScore", type: "uint256" },
          { internalType: "uint256", name: "bestSingleScore", type: "uint256" },
          { internalType: "uint256", name: "submissionCount", type: "uint256" },
          {
            internalType: "uint256",
            name: "lastSubmissionTime",
            type: "uint256",
          },
        ],
        internalType: "struct ExerciseLeaderboard.LeaderboardEntry[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserScore",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "totalScore", type: "uint256" },
          { internalType: "uint256", name: "bestSingleScore", type: "uint256" },
          { internalType: "uint256", name: "submissionCount", type: "uint256" },
          {
            internalType: "uint256",
            name: "lastSubmissionTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "firstSubmissionTime",
            type: "uint256",
          },
        ],
        internalType: "struct ExerciseLeaderboard.Score",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserRank",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getLeaderboardSize",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract configurations for individual exercise leaderboards
// PUBLIC LEADERBOARDS - Users can submit their own scores directly
export const PULLUPS_LEADERBOARD_CONFIG: ContractConfig = {
  address: "0xf117057bd019C9680D5C92b48d825C294FA6c197", // Pullups Leaderboard on Base Sepolia (Public)
  abi: EXERCISE_LEADERBOARD_ABI,
};

export const JUMPS_LEADERBOARD_CONFIG: ContractConfig = {
  address: "0xCD12e7B14dE9481297D4f32d98177aEC95fcC444", // Jumps Leaderboard on Base Sepolia (Public)
  abi: EXERCISE_LEADERBOARD_ABI,
};

// Legacy config for backward compatibility
export const FITNESS_LEADERBOARD_CONFIG: ContractConfig =
  JUMPS_LEADERBOARD_CONFIG;

// RevenueSplitter contract configuration
export const REVENUE_SPLITTER_CONFIG: ContractConfig = {
  address: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA", // RevenueSplitter on Base Sepolia
  abi: [] as const, // Add ABI if needed for direct interactions
};

// Solana Leaderboard configuration - using the jumps program for leaderboard queries
export const SOLANA_LEADERBOARD_PROGRAM_ID = new PublicKey(
  "7ugCR1KLjHNgUjbW1pZGCadeCHKvUu7NwXsXDTTFypUd" // SOLANA_JUMPS_PROGRAM_ID
);

export const SOLANA_LEADERBOARD_ADDRESS = new PublicKey(
  "7ugCR1KLjHNgUjbW1pZGCadeCHKvUu7NwXsXDTTFypUd" // Placeholder - actual leaderboard account would be separate
);

// Helper function to get contract config
export const getContractConfig = (
  contractName: "leaderboard" | "passport" | "pullups" | "jumps"
): ContractConfig => {
  if (contractName === "passport") {
    return IMPERFECT_COACH_PASSPORT_CONFIG;
  }
  if (contractName === "pullups") {
    return PULLUPS_LEADERBOARD_CONFIG;
  }
  if (contractName === "jumps") {
    return JUMPS_LEADERBOARD_CONFIG;
  }
  return FITNESS_LEADERBOARD_CONFIG;
};
