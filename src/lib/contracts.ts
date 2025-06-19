import { ContractConfig } from './types';

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
export const getContractConfig = (): ContractConfig => {
  return FITNESS_LEADERBOARD_CONFIG;
};
