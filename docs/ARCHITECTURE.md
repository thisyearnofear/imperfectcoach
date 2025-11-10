# Dual-Chain Equal Partnership Architecture

## Current vs. Proposed

### Current (Base-Only)

```
┌─────────────────────────────────────────────────────────┐
│                    Imperfect Coach App                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Header                                                 │
│  ├─ MultiChainWallet → wagmi (Base only)               │
│  └─ NetworkStatus → Base Sepolia                       │
│                                                          │
│  UserContext (EVM/Base)                                 │
│  ├─ connectWallet() → Coinbase wallet                  │
│  ├─ signInWithEthereum() → SIWE signature              │
│  └─ submitScore() → Base contract (CoachOperator)      │
│                                                          │
│  Leaderboard                                            │
│  ├─ useReadContract(JUMPS_LEADERBOARD)                 │
│  └─ useReadContract(PULLUPS_LEADERBOARD)               │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │
         ▼
   ┌──────────────────┐
   │  Base Sepolia    │
   │  Contracts       │
   │  (on-chain)      │
   └──────────────────┘

❌ BLOCKER: Solana-only users can't use app
❌ BLOCKER: Only reads from Base contracts
```

### Proposed (Dual-Chain Equal Partnership)

```
┌─────────────────────────────────────────────────────────┐
│                    Imperfect Coach App                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Header                                                 │
│  ├─ UnifiedWallet (Enhanced)                           │
│  │  ├─ Base address (wagmi) + disconnect               │
│  │  └─ Solana address (adapter) + disconnect           │
│  └─ NetworkStatus → dual chain aware                   │
│                                                          │
│  UserContext (Enhanced - Per-Chain Auth)                │
│  ├─ Base path:                                          │
│  │  ├─ connectWallet() → Coinbase                      │
│  │  └─ signInWithEthereum() → SIWE                     │
│  ├─ Solana path:                                        │
│  │  ├─ connectSolanaWallet() → Phantom/Solflare        │
│  │  └─ web3 auth (wallet signature)                    │
│  └─ shared submitScore() → routes to correct contract  │
│                                                          │
│  Leaderboard (Enhanced - Dual Contract Read)            │
│  ├─ Chain filter: "All" / "Base" / "Solana"           │
│  ├─ Parallel reads:                                    │
│  │  ├─ Base: useReadContract(JUMPS + PULLUPS)         │
│  │  └─ Solana: useReadContract(LEADERBOARD_PROGRAM)   │
│  └─ Unified display from BOTH contracts                │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
   ┌──────────────────┐        ┌──────────────────┐
   │ Base Sepolia     │        │ Solana Devnet    │
   │ Contracts        │        │ Leaderboard      │
   │ (CoachOperator)  │        │ Program          │
   │ JUMPS_LEADERBOARDupload │         │
   │ PULLUPS_LEADERBOARD    │        │
   └──────────────────┘        └──────────────────┘
         ▲                              ▲
         │                              │
    Submit from                    Submit from
    Base wallet                    Solana wallet
    (on-chain)                     (on-chain)

✅ Solana-only users: connect Solana → submit to Solana contract → leaderboard
✅ Base-only users: unchanged behavior (still works)
✅ Multi-chain users: both wallets connected, both contracts read
✅ Unified leaderboard: Read from BOTH contracts, display together
✅ True decentralization: All scores on-chain from day 1
```

---

## Data Flow: Score Submission

### Solana User Path
```
User connects Solana wallet
         │
         ▼
   Play workout
         │
         ▼
  Generate score (pullups, jumps)
         │
         ▼
User clicks "Submit Score"
         │
         ▼
UserContext.submitScore(pullups, jumps)
  ├─ Detect: solanaAddress is set, address is not
  │
  └─ Call: writeContract to Solana Leaderboard Program
       │
       ├─ submitScore instruction
       │ (user_address, pullups, jumps, timestamp)
       │
       ├─ Pending toast: "Submitting to Solana..."
       │
       └─ Wait for confirmation
           │
           ▼
        Toast: "Score confirmed on Solana!"
           │
           ▼
    Leaderboard auto-refetch
  (reads Solana contract, sees new entry)
```

### Base User Path
```
User has only Base connected
         │
         ▼
  Generate score (pullups, jumps)
         │
         ▼
User clicks "Submit Score"
         │
         ▼
UserContext.submitScore(pullups, jumps)
  ├─ Detect: address is set, solanaAddress is not
  │
  └─ Call: writeContract to Base CoachOperator contract
       │
       ├─ submitWorkoutSession instruction
       │ (exercises, scores, timestamp)
       │
       ├─ Pending toast: "Submitting to Base..."
       │
       └─ Wait for confirmation
           │
           ▼
        Toast: "Score confirmed on Base!"
           │
           ▼
    Leaderboard auto-refetch
  (reads Base contracts, sees new entry)
```

### Multi-Chain User Path
```
User has both Base + Solana connected
         │
         ▼
  Generate score (pullups, jumps)
         │
         ▼
User clicks "Submit Score"
         │
         ▼
UI Modal: "Choose chain to submit to"
├─ Option 1: Submit to Solana
│ └─ writeContract to Solana Leaderboard Program
│
└─ Option 2: Submit to Base
  └─ writeContract to Base CoachOperator contract
      │
      ├─ Pending toast
      │
      └─ Success toast when confirmed
           │
           ▼
    Leaderboard auto-refetch (reads BOTH contracts)
  (displays user score from chosen chain)
```

---

## Data Models

### Leaderboard Score (Base Contract)
```typescript
// Existing - no changes
type BaseLeaderboardEntry = {
  user: string;                 // 0x... address
  pullups: number;
  jumps: number;
  totalScore: bigint;           // pullups + jumps
  bestSingleScore: bigint;
  submissionCount: bigint;
  lastSubmissionTime: bigint;   // unix seconds
};
```

### Leaderboard Score (Solana Program)
```typescript
// New - matches Base structure for unified display
type SolanaLeaderboardEntry = {
  user: string;                 // Solana pubkey
  pullups: number;
  jumps: number;
  totalScore: bigint;           // pullups + jumps
  bestSingleScore: bigint;
  submissionCount: bigint;
  lastSubmissionTime: bigint;   // unix seconds
};
```

### Unified Leaderboard Display
```typescript
type UnifiedLeaderboardEntry = {
  user: string;                 // 0x... or solana addr
  chain: 'base' | 'solana';    // which contract it came from
  pullups: number;
  jumps: number;
  totalScore: number;
  submissionCount: number;
  lastSubmissionTime: bigint;
};
```

### User Auth State (Enhanced UserContext)
```typescript
type UserState = {
  // Base (EVM)
  address?: string;
  isConnected: boolean;
  isAuthenticated: boolean;    // SIWE signed
  
  // Solana (NEW)
  solanaAddress?: string;
  isSolanaConnected: boolean;
  
  // Shared
  isLoading: boolean;
  error?: string;
};

type UserActions = {
  // Base
  connectWallet: () => Promise<void>;
  signInWithEthereum: () => Promise<void>;
  signOut: () => void;           // disconnects Base
  
  // Solana (NEW)
  connectSolanaWallet: () => Promise<void>;
  disconnectSolana: () => void;
  
  // Shared
  submitScore: (pullups, jumps) => Promise<{ hash?: string }>;
};
```

---

## Wallet Display (Header)

### Compact Layout (Current)
```
┌────────────────────────────────────────┐
│ Network ┃ [Wallet addr] ┃ Settings     │
└────────────────────────────────────────┘
```

### Enhanced Layout (Phase 1)
```
┌────────────────────────────────────────┐
│ Network ┃ [🔵 Base addr] [🌕 SOL addr] ┃ ⋮
└────────────────────────────────────────┘
                                       │
                                       ▼ (dropdown)
                              ┌──────────────────┐
                              │ Base: 0x123...  │
                              │ [Disconnect]    │
                              │ ────────────── │
                              │ Solana: AAAA... │
                              │ [Disconnect]    │
                              └──────────────────┘
```

---

## Query Performance

### Leaderboard Load Time Target: <500ms (p95)

```
getLeaderboard(limit=100, chain='all') → Parallel contract reads
│
├─ Base contracts (existing):
│  ├─ Read JUMPS_LEADERBOARD.getTopUsers(10)
│  └─ Read PULLUPS_LEADERBOARD.getTopUsers(10)
│
├─ Solana program (new):
│  └─ Read LEADERBOARD_PROGRAM.getTopUsers(10)
│
├─ Parallel execution: useReadContract + custom Solana read hook
│ ├─ staleTime: 30s (keep fresh)
│ ├─ cacheTime: 5m (prevent unnecessary refetch)
│ └─ refetchOnWindowFocus: false (manual control)
│
├─ Merge results:
│  ├─ Combine Base jumps + pullups per user
│  ├─ Combine Solana jumps + pullups per user
│  └─ Merge users from both chains
│
└─ Result: Array<UnifiedLeaderboardEntry>
   │
   ├─ Sort by totalScore DESC
   ├─ Add chain badges ('base' / 'solana')
   ├─ Add ranks
   └─ Render: TableLeaderboard component
```

---

## Regression Prevention

### Base-Only User Workflows (Must Not Break)

**Workflow 1: Existing Base user, no Solana**
```
User already uses app with Base wallet
         │
         ▼
Existing behavior:
├─ Header shows Base wallet
├─ Can submit scores to Base contract (optional)
├─ Leaderboard shows all scores (from Supabase)
└─ No Solana button visible or required

✅ No changes to user experience
```

**Workflow 2: Connection without SIWE**
```
Some users may not require SIWE auth
         │
         ▼
UserContext supports: requireSiwe?: false option
├─ Base connection only (no signature)
├─ Still routes scores to Supabase
└─ Works fine (SIWE not checked if disabled)

✅ Backward compatible
```

**Workflow 3: On-chain leaderboard readers**
```
TableLeaderboard.tsx formerly read contracts directly
         │
         ▼
Now reads Supabase instead
├─ Same data (no duplicates, unified source)
├─ Same UI rendering (no visual breaking changes)
└─ Slightly faster (Supabase cached vs contract reads)

✅ Same user experience, possibly better
```

---

## Phase 2: Production Deployment & Mainnet

```
┌─────────────────────────────────────────────────────┐
│  Phase 1 Complete: Dual-Contract Leaderboard        │
│  (Base Sepolia + Solana Devnet)                     │
└─────────────────────────────────────────────────────┘
                      │
        After successful Phase 1...
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│   Phase 2: Mainnet Deployment                       │
│                                                      │
│   Deploy Solana program to mainnet:                 │
│   ├─ Production version of Leaderboard Program      │
│   ├─ Hardened access control                        │
│   ├─ Rate limiting & validation                     │
│   └─ Cross-program invocation support               │
│                                                      │
│   Deploy Base contract upgrade:                     │
│   ├─ Mainnet versions (if not already there)        │
│   ├─ Mainnet CoachOperator contract                 │
│   └─ Mainnet leaderboard contracts                  │
│                                                      │
│   Update app:                                       │
│   ├─ Switch RPC to mainnet (Solana)                 │
│   ├─ Switch RPC to Base mainnet                     │
│   ├─ Update contract addresses                      │
│   └─ Deploy to production                           │
│                                                      │
│   Result:                                           │
│   ├─ Solana mainnet: Real scores, real tokens       │
│   ├─ Base mainnet: Real scores, real settlement     │
│   └─ Users can earn real value on either chain      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Key Advantages of This Architecture

| Aspect | Advantage |
|--------|-----------|
| **Equal chain support** | ✅ Connect Base or Solana, submit to either chain |
| **Single leaderboard** | ✅ No fragmentation, read BOTH contracts unified |
| **True decentralization** | ✅ All scores on-chain from day 1 |
| **Consistent pattern** | ✅ Same pattern as Base (contract → read) |
| **No off-chain dependency** | ✅ No database required, self-sovereign data |
| **Performance** | ✅ Contract reads cached, parallel execution |
| **Composability** | ✅ Users can build on both Base and Solana leaderboard programs |
| **Chain symmetry** | ✅ Both Solana and Base are first-class citizens |
| **User control** | ✅ Choose which chain to submit to, not forced |
| **Future-proof** | ✅ Can add more chains with same pattern |

---

## Implementation Checklist

- [x] Architecture designed
- [ ] Phase 1: ROADMAP.md
- [ ] Phase 1: PHASE1_IMPLEMENTATION.md
- [ ] Task 3: Supabase schema + helpers
- [ ] Task 1: UserContext per-chain auth
- [ ] Task 2: UnifiedWallet dual display
- [ ] Task 4: submitScore routing
- [ ] Task 5: Leaderboard Supabase queries
- [ ] Task 6: End-to-end testing
- [ ] Phase 1 complete: Review + iterate
- [ ] Phase 2 (optional): Solana program
