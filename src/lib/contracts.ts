import { ContractConfig } from './types';

export const IMPERFECT_COACH_PASSPORT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "achievement",
        "type": "uint256"
      }
    ],
    "name": "AchievementUnlocked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "CoachOperatorSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "PassportMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "uint32",
            "name": "level",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "totalPullups",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "totalJumps",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "pullupPersonalBest",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "jumpPersonalBest",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "currentStreak",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "longestStreak",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "lastWorkoutDay",
            "type": "uint32"
          },
          {
            "internalType": "uint64",
            "name": "totalWorkoutSessions",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "firstWorkoutTimestamp",
            "type": "uint64"
          }
        ],
        "indexed": false,
        "internalType": "struct ImperfectCoachPassport.PassportData",
        "name": "data",
        "type": "tuple"
      }
    ],
    "name": "PassportUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "newStreak",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "streakBroken",
        "type": "bool"
      }
    ],
    "name": "StreakUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "CENTURY_PULLUPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "CONSISTENT_ATHLETE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "FIRST_WORKOUT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "LEVEL_10",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MONTH_STREAK",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "THOUSAND_JUMPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WEEK_STREAK",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "coachOperator",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getAchievements",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getPassportData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint32",
            "name": "level",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "totalPullups",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "totalJumps",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "pullupPersonalBest",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "jumpPersonalBest",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "currentStreak",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "longestStreak",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "lastWorkoutDay",
            "type": "uint32"
          },
          {
            "internalType": "uint64",
            "name": "totalWorkoutSessions",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "firstWorkoutTimestamp",
            "type": "uint64"
          }
        ],
        "internalType": "struct ImperfectCoachPassport.PassportData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "getTokenId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "achievement",
        "type": "uint256"
      }
    ],
    "name": "hasAchievement",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_operator",
        "type": "address"
      }
    ],
    "name": "setCoachOperator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint32",
        "name": "level",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "totalPullups",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "totalJumps",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "pullupPersonalBest",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "jumpPersonalBest",
        "type": "uint32"
      },
      {
        "internalType": "bool",
        "name": "isNewWorkout",
        "type": "bool"
      }
    ],
    "name": "updatePassport",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const IMPERFECT_COACH_PASSPORT_CONFIG: ContractConfig = {
    address: "0x7ACE72cdD241e26be842381fF2AfAcBB9d969718",
    abi: IMPERFECT_COACH_PASSPORT_ABI,
};

// Contract ABI - extracted from your Solidity contract
export const FITNESS_LEADERBOARD_ABI = [
  {
    "inputs": [{"internalType": "bool", "name": "_testMode", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "remainingTime", "type": "uint256"}],
    "name": "CooldownNotExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidInput",
    "type": "error"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "score", "type": "uint256"},
      {"internalType": "uint256", "name": "maxAllowed", "type": "uint256"}
    ],
    "name": "ScoreExceedsMaximum",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SubmissionsDisabled",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UserNotFound",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "pullups", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "jumps", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "totalPullups", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "totalJumps", "type": "uint256"}
    ],
    "name": "ScoreAdded",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_pullups", "type": "uint256"},
      {"internalType": "uint256", "name": "_jumps", "type": "uint256"}
    ],
    "name": "addScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLeaderboard",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "user", "type": "address"},
          {"internalType": "uint256", "name": "pullups", "type": "uint256"},
          {"internalType": "uint256", "name": "jumps", "type": "uint256"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct FitnessLeaderboardBase.Score[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "limit", "type": "uint256"}],
    "name": "getLeaderboardByPullups",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "user", "type": "address"},
          {"internalType": "uint256", "name": "pullups", "type": "uint256"},
          {"internalType": "uint256", "name": "jumps", "type": "uint256"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct FitnessLeaderboardBase.Score[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "limit", "type": "uint256"}],
    "name": "getLeaderboardByJumps",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "user", "type": "address"},
          {"internalType": "uint256", "name": "pullups", "type": "uint256"},
          {"internalType": "uint256", "name": "jumps", "type": "uint256"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct FitnessLeaderboardBase.Score[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserScore",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "user", "type": "address"},
          {"internalType": "uint256", "name": "pullups", "type": "uint256"},
          {"internalType": "uint256", "name": "jumps", "type": "uint256"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct FitnessLeaderboardBase.Score",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getTimeUntilNextSubmission",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalUsers",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "userExists",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract configuration
export const FITNESS_LEADERBOARD_CONFIG: ContractConfig = {
  address: "0x025D862255d5bc6F7D84fa5EBc252474D5092FB9", // Deployed on Base Sepolia
  abi: FITNESS_LEADERBOARD_ABI,
};

// Helper function to get contract config
export const getContractConfig = (contractName: 'leaderboard' | 'passport'): ContractConfig => {
  if (contractName === 'passport') {
    return IMPERFECT_COACH_PASSPORT_CONFIG;
  }
  return FITNESS_LEADERBOARD_CONFIG;
};
