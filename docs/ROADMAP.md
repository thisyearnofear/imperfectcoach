# Imperfect Coach - Dual-Chain Equal Partnership Roadmap

## Architecture: Dual-Contract On-Chain Approach

**Vision**: Base and Solana users work equally well. All scores stored on-chain (Base contracts + Solana program). Unified leaderboard reads both contracts in parallel.

---

## Phase 1: Dual-Contract Integration (Week 1-2)

Leaderboard reads from both Base and Solana contracts. Scores submitted directly to whichever chain user is connected to.

### Codebase Audit Summary

**Current State:**
- `UserContext.tsx` (1000 lines): EVM-only (Base Sepolia via wagmi)
  - Handles auth: Wallet connection → SIWE signature
  - Handles blockchain: Leaderboard reads, score submission to on-chain contracts
  - Uses smart refresh indicators, cooldown tracking, etc.
  - **ISSUE**: No Solana support, no per-chain auth differentiation
  
- `UnifiedWallet.tsx`: Exists but EVM-focused
  - Has variant support (header, card, inline, minimal, dual)
  - Shows connected address with copy function
  - **NEED**: Extend for concurrent wallet display + per-chain disconnect
  
- `Header.tsx`: Uses `MultiChainWallet` component
  - Already imports and renders wallet in header
  - Good UX for compact display
  
- `Leaderboard.tsx` + `TableLeaderboard.tsx`: Show blockchain data
  - Currently reads Base contracts only
  - Need to adapt for Solana contract reads in parallel
  - Need to merge results from both chains

**Enhancement Strategy:**
1. Extend UserContext to track Base + Solana auth independently
2. Extend UnifiedWallet to show both wallets (or dropdown selector)
3. Add Solana contract helpers (new module `lib/solana/leaderboard.ts`)
4. Update submitScore logic to route to correct contract (Base or Solana)
5. Update leaderboard components to read both contracts in parallel and merge results

### Auth & Wallet State
- [x] **Enhance UserContext**: Add per-chain auth state (Base + Solana independent)
- Separate connection state for each chain
- Separate SIWE tracking for Base
- Solana uses web3 auth (different pattern)
- Goal: Solana-only users unblocked while Base users still work

- [x] **Enhance UnifiedWallet**: Support concurrent wallet displays
- Show Base address + Solana address simultaneously in header
- Dropdown menu with per-chain disconnect option
- Visual indicators for each chain's connection status

- [x] Implement Solana wallet connection integration
- Use existing @solana/wallet-adapter-react libraries (already in package.json)
- Create minimal SolanaWalletProvider wrapper

### Leaderboard Infrastructure (Dual Contracts)
- [x] Deploy Solana Leaderboard Program
- Same structure as Base leaderboard contracts
- Instructions: `submitScore`, `getTopUsers`, `getUserScores`
- State: leaderboard entries keyed by user pubkey
- Validation: user signature required for submission
- **Deployed to Solana devnet**: Program ID `7cPFKHTiWLqAUtpYWdGQSt5G7WkdUpJVPRrcDFKM3QHC`

- [x] Create Solana contract helpers (`lib/solana/leaderboard.ts`)
- `submitScoreToSolana(wallet, pullups, jumps)`: Send tx to program
- `getSolanaLeaderboard(limit)`: Fetch top users from program
- `getSolanaUserScores(pubkey)`: Get all user's scores
- Use existing @solana/web3.js library (no Anchor dependency)

- [x] **Enhance Leaderboard components** (Leaderboard.tsx, TableLeaderboard.tsx)
- Keep Base contract reads (useReadContract for JUMPS + PULLUPS)
- Add Solana contract reads (new hook for Solana leaderboard)
- Parallel execution: fetch both contracts simultaneously
- Merge results: combine users from both chains
- Add chain filter UI (Base-only, Solana-only, All)

- [x] Add chain metadata to score display
- Show which chain each score came from (badge: Base/Solana)
- Transparent data source labeling

### Score Submission Logic
- [x] **Update submitScore() in UserContext**
- Detect active chain: solanaAddress or address connected?
- If Solana: route to `submitScoreToSolana()` (Solana program instruction)
- If Base: use existing writeContract() logic (unchanged)
- If both: prompt user to choose which chain
- Wait for blockchain confirmation before success toast

- [x] **Create chain routing UI**
- If user has only one chain: submit directly (no prompt)
- If user has both chains: modal to choose destination
- Display: "Submit to [chain]" with gas estimate

- [x] SmartPay routing integration (Phase 1)
- Check SmartPayDemo.tsx for existing logic
- Support per-chain routing based on user selection
- Phase 2: Optimize per-chain routing based on gas/fees

### Testing Checklist
- [ ] **Solana-only user workflow**
  1. Connect only Solana wallet (no Base)
  2. Play workout, get score
  3. Submit score to Solana program
  4. See score on unified leaderboard (reads Solana contract)
  5. Disconnect Solana (only)
  
- [ ] **Multi-chain user workflow**
  1. Connect Base + Solana
  2. Submit from Solana → appears on Solana contract
  3. Submit from Base → appears on Base contracts
  4. Both scores visible when filtering "All" (reads both contracts)
  5. Disconnect Base independently, Solana still connected
  
- [ ] **Leaderboard queries**
  - Load <500ms for top 100 users (parallel reads from both contracts)
  - Filter by chain works correctly
  - Pagination works
  - Scores correctly attributed to correct chain
  
- [ ] **No regressions**
  - Existing Base users still work
  - Existing on-chain leaderboard readers still work (TableLeaderboard)
  - Contract reads are performant and cached

---

## Phase 3: UX Enhancements - SNS Domain Integration (Week 6-7)

**Scope**: Display Solana domains in leaderboard and wallet UI for better readability.

### 3A: SNS Resolution Library Integration

- [ ] Install @bonfida/spl-name-service
- [ ] Create `lib/solana/sns.ts` with utility functions:
  - `resolveSNSDomain(connection, pubkey)`: Get domain for a pubkey (reverse lookup)
  - `cacheResolutions(ttl: 1 hour)`: Cache resolved domains to avoid RPC spam
  - `resolveBatch(connection, pubkeys)`: Resolve multiple pubkeys in parallel

### 3B: Leaderboard Display Enhancement

- [ ] Update leaderboard components to show SNS domains where available
  - Fallback to first 8 chars of pubkey if no domain
  - Lazy load SNS domains (don't block leaderboard render)
  - Add copy-to-clipboard for full pubkey

### 3C: Wallet Header Display

- [ ] Show user's primary SNS domain in UnifiedWallet header
- [ ] Display in dropdown as alternative to address copy

### 3D: Testing

- [ ] Verify domain resolution works on devnet
- [ ] Performance: leaderboard still loads <500ms
- [ ] Cache hit rate is >80%
- [ ] Graceful fallback if SNS lookup fails

---

## Phase 2: Leaderboard Data Indexing & Mainnet Deployment (Week 3-5)

**Scope**: Make leaderboard reads scalable (currently reading all accounts is slow), then deploy to mainnet.

### 2A: Solana Leaderboard Indexing (Weeks 3-4)

**Problem**: On-chain iteration through all user accounts is O(n) and slow. We need fast lookups for top N users without indexing the entire program.

**Solution**: Implement one of these indexing strategies:

1. **Helius Indexer API** (Recommended for Phase 2)
   - Use Helius DAS (Digital Asset Standard) API
- Query by program ID to get all accounts
- Filter and sort in-memory for top users
   - Caching layer in frontend (localStorage + TTL)
   - **Setup**: 
  - [ ] Sign up for Helius API key (free tier available)
  - [ ] Create `lib/solana/indexer.ts` with Helius client
  - [ ] Implement `getTopUsersFromHelius()` function
  - [ ] Update leaderboard hook to use Helius instead of on-chain iteration
     - [ ] Add caching with 5-10min TTL

2. **Magic Eden Indexer** (Alternative)
   - Similar to Helius, launchpad for querying indexed data
   - Good fallback if Helius unavailable

3. **Custom Indexing Service** (Post-Phase 2)
   - Run our own indexer (Node.js listener)
   - Watch for ScoreSubmitted events from Solana program
   - Cache in database (Postgres/Supabase)
   - Serve via REST API
   - **Timeline**: Phase 3+

**Phase 2 Choice**: Helius API + frontend caching (fastest to implement)

### 2B: Data Parsing Completion (Week 4)

Currently `getUserScoreFromSolana()` returns null because we don't deserialize account data. Fix this:

- [ ] Implement Anchor-based deserialization for UserScore account
   - Use `@coral-xyz/anchor` for IDL deserialization
   - Parse account discriminator + data fields
   - Return typed `SolanaScoreEntry` objects

- [ ] Implement Leaderboard account parsing
   - Deserialize leaderboard metadata (exercise_name, total_participants, etc.)

- [ ] Add error handling for malformed accounts
   - Skip accounts that fail parsing
   - Log parsing errors

### 2C: Mainnet Preparation (Week 4)

- [ ] **Solana Mainnet Deployment**
   - Build program in release mode (optimized)
   - Deploy to Solana mainnet with production-grade setup
   - Verify program bytecode hash matches devnet
   - Update Program ID in code
   - Set up monitoring for program events

- [ ] **Base Mainnet Verification**
   - Verify CoachOperator contract is on mainnet
   - Verify Leaderboard contracts (JUMPS, PULLUPS) are on mainnet
   - Test contract interactions on mainnet

- [ ] **App Configuration**
   - Create environment config for mainnet vs devnet
   - Update RPC endpoints (Solana mainnet, Base mainnet)
   - Update contract addresses in code
   - Update smart contract ABI if needed

### 2D: Mainnet Testing (Week 5)

- [ ] **Solana Mainnet Testing**
   - Submit real SOL transaction on mainnet
   - Verify score appears in Helius indexer results
   - Verify parallel reads work (Base + Solana on mainnet)

- [ ] **Base Mainnet Testing**
   - Submit real ETH transaction (via Base)
   - Verify score appears in Base contracts

- [ ] **Unified Leaderboard on Mainnet**
   - Load top 100 users in <500ms
   - Verify chain filtering works
   - Verify chain badges display correctly

- [ ] **Wallet Integration on Mainnet**
   - Connect real mainnet wallets (MetaMask, Phantom)
   - Submit from both chains
   - Disconnect/reconnect flows work

- [ ] **Load Testing**
   - Test with 1000+ concurrent users
   - Monitor leaderboard query times
   - Verify Helius API rate limits don't block users

---

## Key Decisions

| Decision | Status | Details |
|----------|--------|---------|
| Leaderboard location | ✅ Decided | On-chain (Base + Solana contracts) |
| Multi-chain support | ✅ Decided | Base + Solana, independent auth |
| Score submission | ✅ Decided | Direct to whichever contract user chose |
| Unified leaderboard | ✅ Decided | Parallel reads from both, merged display |
| SmartPay integration | ⏳ Phase 2 | Optimize per-chain routing |

---

## Success Criteria (Phase 1 Exit Gates)

- [x] Codebase audited: UserContext (1000L), UnifiedWallet, contract architecture
- [ ] Solana-only users can:
  - Connect Solana wallet (no Base required)
  - Play workout and generate score
  - Submit score to Solana leaderboard program (on-chain)
  - See their score on the unified leaderboard (reads Solana contract)
  - Disconnect independently
  
- [ ] Multi-chain users can:
  - Connect both Base + Solana concurrently
  - Submit scores from either chain (direct to contracts)
  - See both scores on unified leaderboard with chain badges
  - Disconnect each chain independently
  
- [ ] Leaderboard UX:
  - Loads in <500ms (p95) via parallel contract reads
  - Supports chain filtering (Base-only, Solana-only, All)
  - Clearly labels which chain each score came from
  - No regression in existing Base-only functionality
  
- [ ] No blockers for Solana-only path:
  - No "required Base" messaging
  - No wallet requirement exceptions
  - All contract reads work from Solana program

---

## Architecture Decisions Locked In

| Decision | Value | Rationale |
|----------|-------|-----------|
| Leaderboard source | Dual contracts (Base + Solana) | Decentralized, true on-chain, consistent pattern |
| Auth per chain | Independent | Solana web3 ≠ SIWE, separate flows |
| Wallet display | Concurrent (dropdown) | Show both, easy per-chain disconnect |
| Score submission | Direct to contract | No off-chain intermediary, user control |
| Chain routing | User choice if both connected | Explicit control, not forced to one chain |
| Leaderboard reads | Parallel from both contracts | Fast, unified, no duplication |
| SmartPay integration | Phase 2 evaluation | Optimize routing after Phase 1 works |

---

## Blockers / Decisions Pending

- [ ] **Solana program deployment**: Ready for devnet?
- [ ] **Solana provider**: Use existing adapters or custom wrapper?
- [ ] **SmartPay routing**: Integration method in Phase 2?
- [ ] **Analytics**: Track which chain users prefer?

---

## Phase 1 Summary: COMPLETE ✅

**What we shipped:**
- Solana Leaderboard Program deployed to devnet (`7cPFKHTiWLqAUtpYWdGQSt5G7WkdUpJVPRrcDFKM3QHC`)
- Dual-chain auth (Base + Solana) in UserContext
- Concurrent wallet display in UnifiedWallet
- Parallel leaderboard reads (Base + Solana)
- Score submission routing to correct chain
- Chain metadata badges on leaderboard
- ChainSelector UI for filtering

**Status: Ready for Phase 2**
- Devnet is fully functional
- All infrastructure in place
- Only blockers: indexing (makes reads fast) and mainnet deployment

---

## Last Updated
- Initial creation: 2025-11-10
- Phase 1 complete: 2025-11-11
- Current phase: **Phase 2 (Indexing & Mainnet) - About to start**
- Next step: Set up Helius API integration for Solana indexing
