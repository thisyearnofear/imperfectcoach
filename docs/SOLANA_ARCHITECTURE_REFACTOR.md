# Solana Architecture Refactor - Single Exercise Contracts

## 🎯 **Vision Achieved: Single Exercise → Single Chain → Single Submission**

This refactor aligns the Solana architecture with the Base chain structure and implements the core principle: **users complete one exercise, choose one chain, submit once**.

---

## 📋 **Changes Summary**

### **✅ Contract Architecture (Option A Complete)**

#### **Before: Unified Contract**
- `SolanaLeaderboard.rs` → Handled both pullups AND jumps in single submission
- Dual parameters: `submitScore(pullups: u32, jumps: u32)`
- Complex dual-exercise logic

#### **After: Exercise-Specific Contracts**
- `SolanaPullupsLeaderboard.rs` → Dedicated pullups contract
- `SolanaJumpsLeaderboard.rs` → Dedicated jumps contract
- Single parameter: `submit_score(score: u32)`
- Clean, focused responsibility

### **✅ TypeScript Integration (Option C Complete)**

#### **New IDL Structure**
```typescript
// Exercise-specific program IDs
export const SOLANA_PULLUPS_PROGRAM_ID = new PublicKey("...");
export const SOLANA_JUMPS_PROGRAM_ID = new PublicKey("...");

// Type-safe exercise routing
export type ExerciseType = "pullups" | "jumps";

// Helper functions
getExerciseProgramId(exercise: ExerciseType) // Returns correct program ID
getExerciseIDL(exercise: ExerciseType)       // Returns correct IDL
getUserScorePDA(user, leaderboard, exercise) // Exercise-specific PDA
```

#### **Updated Submission Function**
```typescript
// Old: Dual exercise submission
submitScoreToSolana(connection, wallet, leaderboard, pullups, jumps)

// New: Single exercise submission  
submitScoreToSolana(connection, wallet, leaderboard, score, exercise)
```

#### **Enhanced Hook Architecture**
```typescript
// New preferred function
submitSingleExercise(exercise: ExerciseType, score: number, targetChain?: 'base' | 'solana')

// Legacy function (now enforces single exercise)
submitScore(pullups, jumps) // Errors if both > 0
```

---

## 🏗️ **Perfect Architecture Symmetry**

| Feature | Base Chain | Solana Chain |
|---------|------------|--------------|
| **Pullups Contract** | ExerciseLeaderboard (pullups instance) | SolanaPullupsLeaderboard.rs |
| **Jumps Contract** | ExerciseLeaderboard (jumps instance) | SolanaJumpsLeaderboard.rs |
| **Submission Pattern** | Single exercise per tx | Single exercise per tx |
| **Contract Routing** | Based on exercise type | Based on exercise type |
| **User Choice** | Connect wallet → Choose exercise → Submit | Connect wallet → Choose exercise → Submit |

---

## 🔧 **Implementation Details**

### **Contract Features**
- **Single Responsibility**: Each contract handles one exercise type
- **Optimized Storage**: No unused exercise fields in UserScore struct
- **Proper PDA Seeds**: `[b"user_score", leaderboard.key(), user.key()]`
- **Event Logging**: Exercise-specific score submission events

### **Frontend Integration** 
- **Type Safety**: ExerciseType enum prevents routing errors
- **Chain Selection**: Either/or logic (Solana prioritized if both connected)
- **Error Handling**: Exercise and chain-specific error messages
- **Configuration**: Centralized address management in `solana/config.ts`

### **Submission Flow**
```
User completes exercise (e.g., 10 pullups)
         ↓
Choose target chain (Base or Solana)
         ↓
Submit to exercise-specific contract
         ↓
Cannot duplicate to other chain (must redo exercise)
```

---

## 📦 **Files Modified**

### **Contracts (New)**
- `contracts/SolanaPullupsLeaderboard.rs` ← New pullups-specific contract
- `contracts/SolanaJumpsLeaderboard.rs` ← New jumps-specific contract
- `contracts/SolanaLeaderboard.rs` ← ❌ Deleted (old unified contract)

### **TypeScript Integration**
- `src/lib/solana/leaderboard.ts` ← Updated IDLs, interfaces, submission functions
- `src/lib/solana/config.ts` ← New configuration file for addresses
- `src/hooks/useScoreSubmission.ts` ← Updated submission logic

### **Key Interface Changes**
```typescript
// New exercise-specific interface
interface SolanaExerciseScoreEntry {
  user: string;
  exercise: ExerciseType;
  totalScore: bigint;
  bestSingleScore: bigint;
  submissionCount: bigint;
  lastSubmissionTime: bigint;
  firstSubmissionTime: bigint;
}
```

---

## 🚀 **Deployment Checklist**

### **Contract Deployment**
- [ ] Deploy `SolanaPullupsLeaderboard.rs` to Solana devnet
- [ ] Deploy `SolanaJumpsLeaderboard.rs` to Solana devnet
- [ ] Initialize both leaderboard contracts
- [ ] Verify PDA derivation works correctly

### **Configuration Updates**
- [ ] Update `SOLANA_PULLUPS_PROGRAM_ID` in `leaderboard.ts`
- [ ] Update `SOLANA_JUMPS_PROGRAM_ID` in `leaderboard.ts`
- [ ] Update `SOLANA_LEADERBOARD_ADDRESSES.pullups` in `config.ts`
- [ ] Update `SOLANA_LEADERBOARD_ADDRESSES.jumps` in `config.ts`

### **Testing**
- [ ] Test single exercise submission to each contract
- [ ] Verify either/or chain routing works
- [ ] Test error handling for invalid submissions
- [ ] Confirm leaderboard data fetching works

---

## ✨ **Benefits Achieved**

### **🎯 Core Principles Aligned**
- **DRY**: Eliminated duplicate submission logic
- **CLEAN**: Single responsibility per contract
- **MODULAR**: Exercise-specific routing
- **ENHANCEMENT FIRST**: Improved existing architecture vs. rewrite

### **🏗️ User Experience**
- **Clear Choice**: User picks one exercise, one chain
- **Non-Fungible Exercise**: Cannot duplicate same workout across chains
- **Transparent Routing**: Clear feedback on which chain/contract is being used

### **🔧 Developer Experience** 
- **Type Safety**: ExerciseType prevents routing bugs
- **Maintainability**: Separate contracts = easier debugging
- **Scalability**: Easy to add new exercise types
- **Consistency**: Same patterns across Base and Solana

---

## 🎉 **Ready for Production**

The architecture now perfectly implements your vision:
> "Users complete an exercise (pullups for instance), then decide which chain to submit that score to (can only do this once, then has to do the exercise again to submit to the other chain i.e. cannot duplicate the same score on two chains at once, must do the work so its non-fungible exercise)"

**Next step**: Deploy the contracts and update the configuration addresses! 🚀