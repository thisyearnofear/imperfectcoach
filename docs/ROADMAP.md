# Multi-Chain Architecture Roadmap
## Solana-First Support + SmartPay Integration

**Vision:** Enable Solana-only users while maintaining Base leaderboard through hybrid off-chain/on-chain approach.

**Timeline:** 3 weeks
**Status:** Planning → Phase 1 In Progress

---

## PHASE 1: Off-Chain Aggregation (Week 1)
**Goal:** Solana-only users can submit scores; unified leaderboard works

### 1.1 Database Setup
- [ ] **Task:** Create Supabase schema for `leaderboard_scores`
  - Fields: base_address, solana_address, primary_chain, pullups, jumps, submitted_at, tx_hash_base, tx_hash_solana
  - Indexes: created_at, pullups DESC, jumps DESC
  - RLS policies: Users can read all, insert own scores
  - **Owner:** [assign]
  - **Status:** TODO
  - **PR:** TBD

### 1.2 Auth State Enhancement
- [ ] **Task:** Update UserContext interfaces for per-chain auth
  - Add `ChainAuthState` interface
  - Update `UserState.auth: { base?, solana? }`
  - Add `primaryChain: 'base' | 'solana'` selector
  - Maintain backward compatibility (isConnected, isAuthenticated)
  - **Owner:** [assign]
  - **Dependencies:** None
  - **Status:** TODO
  - **File:** `src/contexts/UserContext.tsx`
  - **PR:** TBD

- [ ] **Task:** Implement per-chain auth actions
  - `connectChain(chain)` - Connect specific chain
  - `signInChain(chain)` - Sign-in specific chain
  - `disconnectChain(chain)` - Disconnect specific chain
  - `setPrimaryChain(chain)` - Set leaderboard submission chain
  - **Owner:** [assign]
  - **Dependencies:** 1.2 (interfaces)
  - **Status:** TODO
  - **PR:** TBD

### 1.3 Score Submission Logic
- [ ] **Task:** Refactor `submitScore()` for multi-chain
  - Check which chains authenticated
  - Save to Supabase (source of truth)
  - Attempt on-chain settlement (Base) in background (fire-and-forget)
  - Handle Solana-only, Base-only, or both cases
  - **Owner:** [assign]
  - **Dependencies:** 1.1, 1.2
  - **Status:** TODO
  - **File:** `src/contexts/UserContext.tsx`
  - **PR:** TBD

### 1.4 Header/Wallet UI
- [ ] **Task:** Update header wallet display for concurrent connections
  - Show both Base and Solana addresses if connected
  - Add dropdown menu per wallet with "Disconnect" option
  - Show "Connect Base" / "Connect Solana" as secondary buttons
  - Add SmartPay status indicator when both connected
  - **Owner:** [assign]
  - **Dependencies:** 1.2 (auth state)
  - **Status:** TODO
  - **File:** `src/components/UnifiedWallet.tsx` + `Header.tsx`
  - **PR:** TBD

- [ ] **Task:** Create wallet management dropdown
  - Disconnect individual chains
  - Show chain health status
  - Show addresses in full (with copy)
  - **Owner:** [assign]
  - **Dependencies:** 1.4 (header update)
  - **Status:** TODO
  - **File:** `src/components/WalletDropdown.tsx` (new)
  - **PR:** TBD

### 1.5 Leaderboard Display
- [ ] **Task:** Update leaderboard to fetch from Supabase
  - Query all scores from `leaderboard_scores`
  - Sort by pullups/jumps
  - Show chain indicators (Base/Solana badge per score)
  - Handle pagination
  - **Owner:** [assign]
  - **Dependencies:** 1.1, 1.3
  - **Status:** TODO
  - **File:** `src/components/Leaderboard.tsx`
  - **PR:** TBD

### 1.6 Testing & Validation
- [ ] **Task:** Manual testing - Solana-only flow
  - Connect Phantom (Solana) only
  - Submit score
  - Verify in Supabase
  - Verify in leaderboard UI
  - **Owner:** [assign]
  - **Dependencies:** All 1.x tasks
  - **Status:** TODO

- [ ] **Task:** Manual testing - Base-only flow
  - Connect Base only
  - Submit score
  - Verify on-chain settlement
  - Verify in Supabase and leaderboard
  - **Owner:** [assign]
  - **Dependencies:** All 1.x tasks
  - **Status:** TODO

- [ ] **Task:** Manual testing - Dual flow
  - Connect both Base and Solana
  - Submit score
  - Verify both addresses recorded
  - Verify on-chain settlement
  - **Owner:** [assign]
  - **Dependencies:** All 1.x tasks
  - **Status:** TODO

---

## PHASE 2: SmartPay Integration & Polish (Week 2)
**Goal:** Smart routing works with multi-chain setup; UX polish

### 2.1 SmartPay Routing Update
- [ ] **Task:** Update payment router to accept available chains
  - Check which chains user has authenticated
  - Pass `availableChains` to `selectOptimalChain()`
  - Router respects actual availability
  - **Owner:** [assign]
  - **Dependencies:** 1.2 (auth state)
  - **Status:** TODO
  - **File:** `src/lib/payments/payment-router.ts`
  - **PR:** TBD

### 2.2 SmartPay UI Feedback
- [ ] **Task:** Show which chain will be used for payment
  - Display "Using Solana" / "Using Base"
  - Show in SmartPayButton component
  - Update after routing decision
  - **Owner:** [assign]
  - **Dependencies:** 2.1
  - **Status:** TODO
  - **File:** `src/components/payments/SmartPayButton.tsx`
  - **PR:** TBD

### 2.3 Primary Chain Selector
- [ ] **Task:** Add primary chain preference modal
  - When both chains connected
  - Let user choose preferred chain for leaderboard
  - Persist to localStorage
  - **Owner:** [assign]
  - **Dependencies:** 1.2, 1.4
  - **Status:** TODO
  - **File:** `src/components/PrimaryChainModal.tsx` (new)
  - **PR:** TBD

### 2.4 Analytics & Telemetry
- [ ] **Task:** Track multi-chain usage
  - Log which chains connected
  - Log chain selection per transaction
  - Log score submission chain
  - **Owner:** [assign]
  - **Dependencies:** All 1.x
  - **Status:** TODO
  - **File:** `src/lib/analytics.ts`
  - **PR:** TBD

### 2.5 Error Handling
- [ ] **Task:** Handle multi-chain error scenarios
  - One chain fails, other succeeds
  - Both chains fail gracefully
  - Show user-friendly error messages
  - **Owner:** [assign]
  - **Dependencies:** 1.3
  - **Status:** TODO
  - **File:** `src/contexts/UserContext.tsx`
  - **PR:** TBD

### 2.6 Testing & Polish
- [ ] **Task:** E2E testing - complete user flows
  - Onboarding with Solana only
  - Onboarding with Base only
  - Adding second chain after initial setup
  - Switching primary chain
  - SmartPay routing decisions
  - **Owner:** [assign]
  - **Dependencies:** All 2.x tasks
  - **Status:** TODO

- [ ] **Task:** UI/UX polish
  - Review header layout with dual wallets
  - Ensure dropdown menus work properly
  - Mobile responsiveness
  - Loading states
  - **Owner:** [assign]
  - **Dependencies:** All 1.x + 2.x
  - **Status:** TODO

---

## PHASE 3: Optional On-Chain Settlement (Week 3+)
**Goal:** Solana program deployed; users can opt-in to on-chain settlement

### 3.1 Solana Program Design
- [ ] **Task:** Design Solana leaderboard program
  - Match Base contract functionality
  - Define state structure
  - Define instructions (submit_score, update_score, get_scores)
  - **Owner:** [assign]
  - **Status:** TODO
  - **File:** `contracts/solana/src/lib.rs` (new)
  - **Docs:** `docs/SOLANA_PROGRAM.md` (new)

### 3.2 Solana Program Implementation
- [ ] **Task:** Implement Solana program
  - Build score submission logic
  - Build leaderboard state management
  - Handle ranking/sorting
  - **Owner:** [assign]
  - **Dependencies:** 3.1
  - **Status:** TODO

### 3.3 Solana Program Deployment
- [ ] **Task:** Deploy to Solana devnet
  - Build & test locally
  - Deploy to devnet
  - Document program ID & endpoints
  - **Owner:** [assign]
  - **Dependencies:** 3.2
  - **Status:** TODO
  - **Docs:** `docs/SOLANA_DEPLOYMENT.md` (new)

### 3.4 Settlement Sync
- [ ] **Task:** Sync Supabase scores → Solana on-chain
  - Background job (cron or event-driven)
  - Batch score submissions
  - Handle failures gracefully
  - **Owner:** [assign]
  - **Dependencies:** 3.3, 1.1
  - **Status:** TODO
  - **File:** `src/lib/settlement/solana-sync.ts` (new)

### 3.5 Integration Testing
- [ ] **Task:** Test complete on-chain settlement flow
  - Submit score (Supabase)
  - Background sync to Solana
  - Verify on-chain state
  - Verify consistency across systems
  - **Owner:** [assign]
  - **Dependencies:** 3.4
  - **Status:** TODO

---

## ARCHITECTURE DECISIONS

| Decision | Rationale | Status |
|----------|-----------|--------|
| **Supabase as source of truth** | Unified leaderboard, no fragmentation, faster | ✅ APPROVED |
| **On-chain settlement optional** | Users who want decentralization get it | ✅ APPROVED |
| **Per-chain auth state** | True multi-chain support, no forced chains | ✅ APPROVED |
| **Concurrent wallet support** | SmartPay needs both chains available | ✅ APPROVED |
| **Simple routing feedback** | "Using Solana" messaging only | ✅ APPROVED |
| **Solana-only users fully supported** | Removes Base requirement entirely | ✅ APPROVED |

---

## DEPENDENCIES & BLOCKERS

### Current Blockers
- None identified yet

### External Dependencies
- [ ] Supabase project ready with schema
- [ ] Phantom wallet for Solana testing
- [ ] Solana devnet access (free)

### Internal Dependencies
- Phase 1 blocks Phase 2
- Phase 2 blocks Phase 3
- 1.1 (DB) blocks 1.3 (score submission)
- 1.2 (auth state) blocks 1.3, 1.4, 2.1

---

## PROGRESS TRACKING

### Week 1: Phase 1 (Dec X - Dec Y)
- [ ] All tasks complete
- [ ] Solana-only user can submit score
- [ ] Base-only user can still submit score
- [ ] Leaderboard shows both
- [ ] Build passes
- [ ] Basic testing done

### Week 2: Phase 2 (Dec X - Dec Y)
- [ ] All tasks complete
- [ ] SmartPay integrated
- [ ] Primary chain selector working
- [ ] E2E tests pass
- [ ] UX polished
- [ ] Analytics working

### Week 3+: Phase 3 (Dec X - TBD)
- [ ] Solana program designed
- [ ] Solana program deployed
- [ ] Settlement sync working
- [ ] Full integration tests pass
- [ ] Optional deployment decision

---

## SUCCESS CRITERIA

### Phase 1 Success
- ✅ Solana-only user joins leaderboard without Base
- ✅ Base-only user still works unchanged
- ✅ Dual user can use both (SmartPay ready)
- ✅ No errors in console
- ✅ Leaderboard accuracy verified
- ✅ Build passes
- ✅ No performance regression

### Phase 2 Success
- ✅ SmartPay shows which chain will be used
- ✅ User can set primary chain preference
- ✅ Analytics track usage per chain
- ✅ Error scenarios handled gracefully
- ✅ E2E tests all pass
- ✅ Mobile UI responsive
- ✅ No regression in Phase 1 features

### Phase 3 Success
- ✅ Solana program deployed & verified
- ✅ Score settlement syncs reliably
- ✅ Cross-chain consistency maintained
- ✅ Users can opt-in to on-chain
- ✅ No data loss or duplication
- ✅ Clear migration path

---

## NOTES & CONTEXT

**Architecture Decision:** Hybrid off-chain (Supabase) + optional on-chain (Solana program)
- Solves fragmentation problem (single leaderboard)
- Enables Solana-only users immediately
- Keeps path to decentralization open
- No forced Base requirement

**SmartPay Impact:** Router already has logic; this just exposes actual chain availability to it

**User Flow Changes:**
- Before: "Connect Base wallet"
- After: "Connect a wallet" (Base or Solana, no preference)

**Leaderboard Changes:**
- Before: On-chain only (Base contract)
- After: Off-chain primary (Supabase), on-chain optional (Phase 3)

---

## GETTING HELP

- Architecture questions: See `/docs/solana_first_architecture.md`
- SmartPay details: See `/src/lib/payments/payment-router.ts`
- Current auth: See `/src/contexts/UserContext.tsx`
- Database schema: Check Supabase project
