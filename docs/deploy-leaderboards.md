# Leaderboard Deployment Guide

## Exact Hash Values Required

Based on the CoachOperator.sol contract, you must use these EXACT hash values:

### Exercise Hashes (keccak256)
- **pullups**: `0x70756c6c7570730000000000000000000000000000000000000000000000000`
- **jumps**: `0x6a756d7073000000000000000000000000000000000000000000000000000000`

⚠️ **CRITICAL**: These are the exact bytes32 values that CoachOperator expects. Using any other hash will break the integration.

## Deployment Steps

### Step 1: Deploy ExerciseLeaderboard Contracts

Deploy **TWO** separate ExerciseLeaderboard contracts in Remix:

#### For Pullups:
```solidity
// Constructor parameters:
exerciseName: "pullups"
initialOperator: "0xdEc2d60c9526106a8e4BBd01d70950f6694053A3"
```

#### For Jumps:
```solidity
// Constructor parameters:
exerciseName: "jumps"  
initialOperator: "0xdEc2d60c9526106a8e4BBd01d70950f6694053A3"
```

### Step 2: Register Leaderboards with CoachOperator

Call `addLeaderboard` on your CoachOperator contract (`0xdEc2d60c9526106a8e4BBd01d70950f6694053A3`) **twice**:

#### Register Pullups Leaderboard:
```solidity
addLeaderboard(
    "0x70756c6c7570730000000000000000000000000000000000000000000000000", // pullups hash
    "<PULLUPS_LEADERBOARD_ADDRESS>", // Address from Step 1
    [1000, 300, 10, true] // ExerciseConfig: [maxScore, cooldown, maxDaily, active]
)
```

#### Register Jumps Leaderboard:
```solidity
addLeaderboard(
    "0x6a756d7073000000000000000000000000000000000000000000000000000000", // jumps hash
    "<JUMPS_LEADERBOARD_ADDRESS>", // Address from Step 1
    [1000, 60, 20, true] // ExerciseConfig: [maxScore, cooldown, maxDaily, active]
)
```

### Step 3: Verification

After deployment, verify the setup by calling:

```solidity
// Check if exercises are active
getActiveExercises() // Should return both exercise hashes

// Check leaderboard addresses
getLeaderboard("0x70756c6c7570730000000000000000000000000000000000000000000000000") // Should return pullups leaderboard address
getLeaderboard("0x6a756d7073000000000000000000000000000000000000000000000000000000") // Should return jumps leaderboard address
```

## ExerciseConfig Parameters Explained

```solidity
struct ExerciseConfig {
    uint32 maxScore;           // Maximum score per submission (1000 recommended)
    uint32 cooldown;           // Seconds between submissions (300 = 5min for pullups, 60 = 1min for jumps)
    uint32 maxDailySubmissions; // Max submissions per day (10 for pullups, 20 for jumps)
    bool active;               // Must be true
}
```

## Contract Addresses for Reference

- **CoachOperator**: `0xdEc2d60c9526106a8e4BBd01d70950f6694053A3`
- **ImperfectCoachPassport**: `0x7c95712a2bce65e723cE99C190f6bd6ff73c4212`
- **RevenueSplitter**: `0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA`

## Post-Deployment Frontend Update

After successful deployment, you'll need to update the frontend contract configuration with the new leaderboard addresses.

## Hash Generation (For Reference)

If you need to generate hashes for other exercises in the future:

```javascript
// In browser console or Node.js
const ethers = require('ethers');

// For "pullups"
console.log(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("pullups")));
// Result: 0x70756c6c7570730000000000000000000000000000000000000000000000000

// For "jumps"  
console.log(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("jumps")));
// Result: 0x6a756d7073000000000000000000000000000000000000000000000000000000
```

⚠️ **IMPORTANT**: The CoachOperator contract is hardcoded to look for exactly these hash values in the `_updatePassport` function. Using different hashes will break passport updates.