# Public Leaderboard Deployment Checklist

## Changes Made

### 1. Contract Simplification ✅
- **File**: `contracts/ExerciseLeaderboard.sol`
- **Changes**:
  - Removed `authorizedOperators` mapping
  - Removed `onlyAuthorizedOperator` modifier
  - Removed `OperatorAuthorized` event
  - Removed `addOperator()` and `removeOperator()` functions
  - Removed `isAuthorizedOperator()` function  
  - Simplified constructor - no longer takes `_initialOperator` parameter
  - Added `require(msg.sender == user)` to `addScore()` - users can only submit their own scores
  - Kept `pause()`/`unpause()` for emergency admin control

### 2. Deployment Script ✅
- **File**: `scripts/deploy-public-leaderboards.sh`
- Deploys both Pullups and Jumps leaderboards
- Verifies on Basescan
- Outputs addresses for frontend update

## Deployment Steps

### 1. Deploy Contracts
```bash
# Set your private key (the deployer wallet)
export PRIVATE_KEY="your_private_key_here"

# Run deployment
./scripts/deploy-public-leaderboards.sh
```

**Expected Output:**
```
Pullups: 0x[NEW_ADDRESS]
Jumps:   0x[NEW_ADDRESS]
```

### 2. Update Frontend
Update `src/lib/contracts.ts` with new addresses:
```typescript
export const PULLUPS_LEADERBOARD_CONFIG: ContractConfig = {
  address: "0x[NEW_PULLUPS_ADDRESS]", // UPDATE THIS
  abi: EXERCISE_LEADERBOARD_ABI,
};

export const JUMPS_LEADERBOARD_CONFIG: ContractConfig = {
  address: "0x[NEW_JUMPS_ADDRESS]", // UPDATE THIS
  abi: EXERCISE_LEADERBOARD_ABI,
};
```

### 3. Test Submission
1. Connect wallet
2. Complete a workout (jumps or pull-ups)
3. Click "Submit to Leaderboard"
4. Verify transaction succeeds
5. Check leaderboard updates

## What's Different Now

### Before (Operator Model)
- Only authorized operators could call `addScore()`
- Users couldn't submit directly
- Required backend relayer or manual submission by owner
- Gas estimation failed for regular users

### After (Public Model)
- **Anyone can call `addScore(address user, uint32 score)`**
- Users submit their own scores: `addScore(myAddress, myScore)`
- Contract validates `msg.sender == user` (you can only submit for yourself)
- Direct submission from frontend - no backend needed
- Standard gas estimation works

## Cleanup TODOs

### Files to Review/Remove
- [ ] `contracts/CoachOperator.sol` - No longer needed
- [ ] `scripts/authorize-user-operator.sh` - No longer needed  
- [ ] Any operator-related frontend code (if any exists)

### Frontend Already Clean
- ✅ `useScoreSubmission.ts` already works correctly
- ✅ `BlockchainScoreSubmission.tsx` already passes correct args
- ✅ No operator-specific logic in submission flow

## Security Notes

- Emergency pause/unpause still available to contract owner
- Users can only submit their own scores (enforced by contract)
- ReentrancyGuard still active
- Pausable in case of emergency

## Testing Checklist

- [x] Deploy contracts successfully
  - Pullups: `0xf117057bd019C9680D5C92b48d825C294FA6c197`
  - Jumps: `0xCD12e7B14dE9481297D4f32d98177aEC95fcC444`
- [x] Verify on Basescan (deployments confirmed)
- [x] Update frontend with new addresses
- [x] Update documentation (TECHNICAL_ARCHITECTURE.md)
- [ ] Test wallet connection
- [ ] Test score submission (jumps)
- [ ] Test score submission (pull-ups)
- [ ] Verify leaderboard updates
- [ ] Test with multiple users
- [ ] Verify gas fees are reasonable
- [ ] Check transaction explorer links work

## Rollback Plan

If issues occur:
1. Keep old contract addresses in git history
2. Can revert `src/lib/contracts.ts` to old addresses
3. Old contracts still functional (but require operator authorization)
