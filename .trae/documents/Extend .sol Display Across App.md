## Goals
- Show SNS (.sol) names wherever user identities are displayed, not just in Leaderboard.
- Centralize display name logic with consistent priority: Social → Basename → .sol → truncated address.
- Maintain caching, non-blocking UX, and existing architecture conventions.

## Current State
- Social identity resolution via `useMemoryIdentity` with global cache: `src/hooks/useMemoryIdentity.ts:29-65, 106-221`.
- Basename resolution in `useBasename`: `src/hooks/useBasename.ts:19-87`.
- Leaderboard display name logic in `UserDisplay`: `src/components/Leaderboard.tsx:65-96`.
- Identity lists in `MyPassport` and `SocialDashboard`: `src/components/MyPassport.tsx:202-291, 474-549`; `src/components/SocialDashboard.tsx:31-69, 314-351`.

## Implementation
1. Centralize display name logic
- Add `useDisplayName(address: string, chain?: 'solana'|'base')` exported from `src/hooks/useMemoryIdentity.ts` to avoid creating a new file.
- Compose existing resolvers:
  - `useMemoryIdentity(address)` → `getPrimarySocialIdentity()`
  - `useBasename(address)`
  - `useSolanaNameService(address)` (only when `chain==='solana'`)
- Return `{ displayName, source, isLoading }`, where `source ∈ { 'social','basename','sol','address' }`.
- Priority: social → basename → sol → truncated address.

2. Integrate into components
- SocialDashboard: replace ad-hoc display logic with `useDisplayName(address, chain)` in its list rows: `src/components/SocialDashboard.tsx:314-351`.
- MyPassport: augment identity display to include `.sol` when applicable: `src/components/MyPassport.tsx:202-291`.
- TableLeaderboard and UserContext fallback: use `useDisplayName` where addresses are rendered: `src/components/TableLeaderboard.tsx ~83-85`, `src/contexts/UserContext.tsx:172-176`.

3. Caching and performance
- Reuse existing global caches (`__memoryIdentityCache`, `__snsReverseCache`).
- Keep 5-min TTLs, debounce triggers to avoid rapid fetches.
- Ensure `.sol` lookup runs only on Solana addresses and after social/basename states settle to reduce RPC calls.

4. Config & environments
- Use `VITE_SOLANA_MAINNET_RPC_URL` if set; fallback to `clusterApiUrl('mainnet-beta')` for SNS.
- Keep Devnet interactions in `SolanaProvider` unchanged for wallet UI; SNS reads target mainnet.

5. Heuristics
- Prefer non-subdomain names (no dot) when multiple domains; append `.sol` for display.
- Gracefully handle missing/invalid addresses and return truncated base58.

## Testing
- Unit-smoke in components: verify `displayName` switches through source priority and loading states.
- Manual run: build and preview; test addresses with and without `.sol`.
- Validate no regressions in Leaderboard and that non-Solana addresses are unaffected.

## Rollout
- Implement `useDisplayName`, update the three component call sites, build and run preview for validation.
- If issues, a simple toggle: skip `.sol` branch in the hook to revert behavior.

## Deliverables
- Centralized `useDisplayName` export in `useMemoryIdentity.ts`.
- Updated `SocialDashboard`, `MyPassport`, `TableLeaderboard`/`UserContext` to use the hook.
- Verified build and UI behavior via preview.