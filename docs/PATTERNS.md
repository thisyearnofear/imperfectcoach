# Development Patterns & Commands

## Core Principles (from project brief)

```
✅ ENHANCEMENT FIRST: Extend existing components, don't rewrite
✅ AGGRESSIVE CONSOLIDATION: Delete unused code, no deprecation
✅ PREVENT BLOAT: Audit before adding, consolidate ruthlessly
✅ DRY: Single source of truth for all shared logic
✅ CLEAN: Clear separation of concerns with explicit dependencies
✅ MODULAR: Composable, testable, independent modules
✅ PERFORMANT: Adaptive loading, caching, resource optimization
✅ ORGANIZED: Predictable file structure, domain-driven design
```

---

## File Organization

### Current Structure
```
src/
├── contexts/
│   ├── UserContext.tsx          ← Main auth + blockchain state
│   └── SocialContext.tsx
├── components/
│   ├── Header.tsx               ← Top navigation
│   ├── UnifiedWallet.tsx         ← Wallet display & connection
│   ├── Leaderboard.tsx           ← Leaderboard display
│   ├── TableLeaderboard.tsx      ← Table variant
│   └── ... (many UI components)
├── hooks/
│   ├── useUserHooks.ts           ← Custom hook for UserContext
│   └── ... (domain-specific hooks)
├── lib/
│   ├── types.ts                  ← Shared types
│   ├── contracts.ts              ← Contract configs
│   ├── cdp.ts                    ← Coinbase integrations
│   └── ... (utilities)
├── integrations/
│   └── supabase/
│       ├── client.ts             ← Supabase client
│       └── types.ts              ← Generated types
└── pages/
    └── Index.tsx                 ← Main app page
```

### Pattern: Adding Supabase Helpers

```
src/lib/supabase/
├── client.ts          [EXISTING - don't modify]
├── types.ts           [EXISTING - generated]
├── leaderboard.ts     [NEW - Phase 1 Task 3]
└── auth.ts            [Future - Solana auth if needed]
```

**Why `lib/supabase/leaderboard.ts`?**
- `lib/` = shared utilities (reusable)
- `supabase/` = grouped by integration
- `leaderboard.ts` = domain-specific (single responsibility)
- Not in `contexts/` (contexts are React providers, not utilities)
- Not in `hooks/` (these are helper functions, not React hooks)

---

## Patterns: Enhancement vs. Creation

### Pattern 1: Enhancing Existing Context

**DON'T**: Create new context
```typescript
// ❌ WRONG
export const SolanaContext = createContext(...);

export const SolanaProvider = ({ children }) => { ... };
```

**DO**: Extend existing context
```typescript
// ✅ RIGHT
export interface UserState {
  // Existing
  address?: string;
  isConnected: boolean;
  
  // Enhanced (Phase 1)
  solanaAddress?: string;
  isSolanaConnected: boolean;
}

export const UserProvider = ({ children }) => {
  const { address, isConnected } = useAccount();        // Base (wagmi)
  const { solanaAddress, isSolanaConnected } = useSol(); // Solana (new)
  
  // Single context exports both
};
```

### Pattern 2: Enhancing Existing Component

**DON'T**: Create new component for Solana wallet
```typescript
// ❌ WRONG
export const SolanaWallet = () => { ... };
export const BaseWallet = () => { ... };

// Then in Header:
<BaseWallet />
<SolanaWallet />
```

**DO**: Extend existing wallet component with variant
```typescript
// ✅ RIGHT
interface UnifiedWalletProps {
  variant?: 'header' | 'card' | 'inline';
  chains?: 'base' | 'solana' | 'all';  // NEW
}

export const MultiChainWallet = ({ variant = 'header', chains = 'all' }) => {
  // Existing component enhanced
  const { address } = useAccount();           // Base
  const { solanaAddress } = useSolana();     // Solana (new)
  
  if (variant === 'header' && chains === 'all') {
    return (
      <div className="flex gap-2">
        <BaseAddressBadge address={address} />
        <SolanaAddressBadge address={solanaAddress} />
      </div>
    );
  }
};
```

### Pattern 3: Adding New Domain Module (OK to create)

**OK**: Create new utility module for new domain
```typescript
// ✅ OK (new domain, no existing equivalent)
src/lib/supabase/leaderboard.ts

export async function submitScore(
  address: string,
  chain: 'base' | 'solana',
  pullups: number,
  jumps: number
): Promise<void> {
  const { error } = await supabase
    .from('leaderboard_scores')
    .insert({ user_address: address, chain, pullups, jumps, timestamp: Date.now() });
  
  if (error) throw error;
}

export async function getLeaderboard(
  limit: number = 100,
  chain?: 'base' | 'solana'
): Promise<LeaderboardScore[]> {
  let query = supabase
    .from('leaderboard_scores')
    .select('*')
    .order('total_score', { ascending: false })
    .limit(limit);
  
  if (chain) query = query.eq('chain', chain);
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
```

**Rationale**:
- New domain (Supabase helpers) didn't exist before
- Follows existing pattern (like `lib/cdp.ts`, `lib/contracts.ts`)
- Self-contained, testable, reusable

---

## Patterns: Data Flow

### Pattern: Smart State Management

**Separate concerns**:
```typescript
// ❌ WRONG - mixing too much
const [userState, setUserState] = useState({
  address, isConnected, solanaAddress, isSolanaConnected,
  leaderboard, isLeaderboardLoading,
  score, timeUntilSubmit, ...15 more fields
});

// ✅ RIGHT - separate by concern
const [authState, setAuthState] = useState({ ... });
const [blockchainState, setBlockchainState] = useState({ ... });
const [refreshState, setRefreshState] = useState({ ... });

// Already done in UserContext!
```

### Pattern: Data Flow Direction

**Single direction** (from leaf to root):
```
Component (needs data)
  ↑
  └─ useUser() hook
     ↑
     └─ UserContext provider
        ↑
        └─ Component tree
```

**NOT circular**:
```
❌ Component ↔ Context (two-way updates)
✅ Component → useContext() (one-way read)
✅ Component → useContext().action() (method call, not state update)
```

### Pattern: Async Operations

**Use effects for side effects**:
```typescript
// ✅ RIGHT
useEffect(() => {
  const loadLeaderboard = async () => {
    const data = await getLeaderboard();
    setLeaderboard(data);
  };
  
  loadLeaderboard();
}, [dependency]);

// ❌ WRONG - no async in useEffect directly
useEffect(async () => {
  const data = await getLeaderboard();
}, []);
```

---

## Patterns: Testing

### Pattern: Test Structure

```typescript
// src/lib/supabase/__tests__/leaderboard.test.ts

describe('leaderboard helpers', () => {
  describe('submitScore', () => {
    it('should insert score to Supabase', async () => {
      const result = await submitScore(
        '0x123...',
        'solana',
        10,
        5
      );
      
      expect(result.success).toBe(true);
    });
    
    it('should normalize address to lowercase', async () => {
      // Test that 0xABC... and 0xabc... map to same entry
    });
  });
  
  describe('getLeaderboard', () => {
    it('should return top 100 by total_score', async () => {
      const scores = await getLeaderboard(100);
      expect(scores.length).toBeLessThanOrEqual(100);
      // Verify sorted by total_score DESC
    });
    
    it('should filter by chain when specified', async () => {
      const solanaScores = await getLeaderboard(100, 'solana');
      expect(solanaScores.every(s => s.chain === 'solana')).toBe(true);
    });
  });
});
```

### Pattern: Testing Components

```typescript
// In Leaderboard.tsx test
describe('Leaderboard', () => {
  it('should display scores from Supabase', async () => {
    const mockScores = [
      { user_address: '0x123', chain: 'base', total_score: 100 },
      { user_address: '0x456', chain: 'solana', total_score: 80 },
    ];
    
    jest.mock('@/lib/supabase/leaderboard', () => ({
      getLeaderboard: jest.fn().mockResolvedValue(mockScores),
    }));
    
    render(<Leaderboard />);
    
    await waitFor(() => {
      expect(screen.getByText('0x123')).toBeInTheDocument();
      expect(screen.getByText('0x456')).toBeInTheDocument();
    });
  });
});
```

---

## Patterns: Error Handling

### Pattern: Graceful Degradation

```typescript
// ✅ RIGHT - explicit error handling
const { data: leaderboard, error } = await supabase
  .from('leaderboard_scores')
  .select('*');

if (error) {
  console.error('Failed to load leaderboard:', error);
  toast.error('Could not load leaderboard');
  return null;  // Render fallback UI
}

// ❌ WRONG - silent failure
const { data } = await supabase.from('leaderboard_scores').select('*');
// What if error? User sees nothing
```

### Pattern: Validation

```typescript
// ✅ RIGHT - validate user input
export async function submitScore(
  address: string,
  chain: 'base' | 'solana',
  pullups: number,
  jumps: number
) {
  // Validate
  if (!address || !address.startsWith('0x') && !isSolanaAddress(address)) {
    throw new Error('Invalid address format');
  }
  if (pullups < 0 || jumps < 0) {
    throw new Error('Scores must be non-negative');
  }
  
  // Proceed
  const { error } = await supabase.from('leaderboard_scores').insert({...});
  if (error) throw error;
}
```

---

## Patterns: Performance

### Pattern: Memoization

```typescript
// ✅ RIGHT - memo expensive computations
const leaderboard = useMemo(() => {
  return scores
    .map(score => ({ ...score, rank: calculateRank(score) }))
    .sort((a, b) => b.total_score - a.total_score);
}, [scores]);

// ✅ RIGHT - memo components
export const LeaderboardRow = React.memo(({ score }) => {
  return <tr>...</tr>;
}, (prev, next) => prev.score === next.score);
```

### Pattern: Caching Queries

```typescript
// ✅ RIGHT - React Query for automatic caching
const { data: leaderboard, isLoading } = useQuery({
  queryKey: ['leaderboard', chain],  // Cache key
  queryFn: () => getLeaderboard(100, chain),
  staleTime: 30000,                   // Fresh for 30s
  cacheTime: 300000,                  // Keep in memory for 5m
  refetchOnWindowFocus: false,        // Don't auto-refresh on focus
});
```

---

## Patterns: Commit Messages

```
✅ Good patterns:

feat(auth): Add Solana wallet support to UserContext
- Separate connection state for Solana
- Keep Base SIWE flow unchanged
- No regression for existing Base users

fix(leaderboard): Query Supabase instead of contracts
- Unified leaderboard across chains
- Faster loads with caching

chore: Update ROADMAP with Phase 1 implementation plan
```

```
❌ Bad patterns:

"update stuff"
"bug fixes"
"BROKEN DO NOT MERGE"
"WIP" (use draft PRs instead)
```

---

## Patterns: Code Review Checklist

**Before submitting changes**:

- [ ] **Follows Enhancement First**: Did I extend existing code, or create new?
- [ ] **No Bloat**: Did I remove unused code while adding?
- [ ] **DRY**: Are there any duplicated functions/types?
- [ ] **Error Handling**: Do new functions handle errors gracefully?
- [ ] **Testing**: Are new functions testable? Did I add tests?
- [ ] **Performance**: Any unnecessary re-renders? Proper memoization?
- [ ] **Documentation**: Updated ROADMAP.md, added comments?
- [ ] **No Regressions**: Did I test existing workflows?

---

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check (implicit in build, but useful standalone)
npx tsc --noEmit

# Test (if set up)
npm test

# Update ROADMAP (manually in /docs/ROADMAP.md)
# - Mark completed tasks with [x]
# - Add blockers to "Blockers / Decisions Pending"
# - Update "Last Updated" timestamp

# View progress
cat docs/ROADMAP.md
cat docs/PHASE1_IMPLEMENTATION.md
```

---

## When to Update Documentation

**Update ROADMAP.md**:
- After completing a task (mark [x])
- When blockers arise (add to Blockers section)
- When architecture changes (update Architecture Decisions)
- Weekly: Update "Last Updated" timestamp

**Update PHASE1_IMPLEMENTATION.md**:
- Clarifications on task descriptions
- New testing insights
- Implementation gotchas discovered

**Update ARCHITECTURE.md**:
- Major architectural changes
- New data models discovered
- Performance insights

---

## Frequently Encountered Patterns

### Pattern: Wallet Connection Wrapper

**Existing in project**: `UnifiedWallet.tsx` + `useUser()` hook

When you need wallet data:
```typescript
// ✅ USE THIS
const { address, solanaAddress } = useUser();

// ❌ DON'T DO THIS
const { address } = useAccount();
const solanaAddress = useSolana().address;
// (Inconsistent pattern, should go through useUser context)
```

### Pattern: Leaderboard Queries

**Existing in project**: `useReadContract` hooks in UserContext

When switching to Supabase:
```typescript
// ❌ OLD (Phase 1: Refactor)
const { data: leaderboard } = useReadContract({
  ...JUMPS_LEADERBOARD_CONFIG,
  functionName: 'getTopUsers',
  args: [10],
});

// ✅ NEW (Phase 1: Target)
const { data: leaderboard } = useQuery({
  queryKey: ['leaderboard', chain],
  queryFn: () => getLeaderboard(100, chain),
});
```

### Pattern: Score Submission

**Current**: Contract write + SIWE

**Enhanced (Phase 1)**:
```typescript
const submitScore = async (pullups: number, jumps: number) => {
  // 1. Determine active chain (new)
  const activeChain = solanaAddress ? 'solana' : address ? 'base' : null;
  if (!activeChain) throw new Error('No wallet connected');
  
  // 2. Submit to Supabase (new primary)
  await submitScoreToSupabase(
    activeChain === 'solana' ? solanaAddress : address,
    activeChain,
    pullups,
    jumps
  );
  
  // 3. Optional: Submit to Base contract (existing, kept optional)
  if (address && chain?.id === 84532) {
    writeContract({...});
  }
};
```

---

## Debugging Tips

### Checking Supabase Connection
```typescript
// In browser console
import { supabase } from '@/integrations/supabase/client';
supabase.from('leaderboard_scores').select('count').single();
```

### Checking User Context
```typescript
// In component
const user = useUser();
console.log({ 
  base: user.address, 
  solana: user.solanaAddress, 
  isBaseConnected: user.isConnected,
  isSolanaConnected: user.isSolanaConnected 
});
```

### Checking Leaderboard Loads
```typescript
// In Leaderboard.tsx
useEffect(() => {
  console.time('leaderboard-query');
  // ... query happens
  console.timeEnd('leaderboard-query');
}, []);
```

---

## File Naming Convention

```
Components:     PascalCase.tsx          (Header.tsx, UnifiedWallet.tsx)
Contexts:       PascalCase.tsx          (UserContext.tsx, SocialContext.tsx)
Hooks:          camelCase.ts            (useUser.ts, useBasename.ts)
Utilities:      camelCase.ts            (leaderboard.ts, cdp.ts)
Types:          types.ts or domain.ts   (types.ts, contracts.ts)
Tests:          *.test.ts               (leaderboard.test.ts)
```

---

## When to Use Each Tool

| Task | Tool | Pattern |
|------|------|---------|
| Add feature to existing component | Edit existing file | `// ENHANCED:` comment |
| Create new utility module | Create new `src/lib/...` file | Single responsibility |
| Fix contract/hook bug | Edit + test + update ROADMAP | Add to ROADMAP under fixes |
| Add UI for new chain | Enhance existing component with variant | `chains?: 'base' \| 'solana'` param |
| Refactor bloated function | Split into smaller, testable functions | No new files if within context |
| Add new integration | Create `src/integrations/...` folder | Keep integrations separate |

