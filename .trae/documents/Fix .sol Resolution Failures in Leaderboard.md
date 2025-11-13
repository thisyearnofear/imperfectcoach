## Diagnosis
- 403 errors to `https://api.mainnet-beta.solana.com` indicate CORS/rate-limiting on the public mainnet RPC when called from the browser.
- 422 from Memory API indicates the identity endpoint didn’t accept that wallet (treated gracefully, but it blocks the social fallback).
- SNS resolution currently targets mainnet and runs for Solana entries; Solana Provider uses Devnet for wallet UI, which is fine. The address itself is the same across clusters, but we need a reliable mainnet RPC for SNS.

## Goals
- Ensure `.sol` reverse lookup succeeds reliably in Leaderboard and headers.
- Avoid unnecessary RPC calls and only attempt SNS when social/basename are missing.
- Keep graceful fallback to truncated address with no UI regressions.

## Implementation
1. Reliable mainnet RPC
- Add a config `VITE_SOLANA_MAINNET_RPC_URL` in `.env` to a CORS-friendly provider (e.g. Helius or QuickNode):
  - `VITE_SOLANA_MAINNET_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_KEY`
- The SNS hook already respects this env var; no code change needed after setting it.

2. Conditional SNS lookup
- Update `useDisplayName` in `src/hooks/useMemoryIdentity.ts` to run `useSolanaNameService` only if social and basename are both absent:
  - Compute `shouldRunSNS = !social && !basename && chain === 'solana'` and pass address only when true.
  - This avoids repeated mainnet calls when a better identity already exists.

3. Request hygiene
- Strengthen global cache (already present) by early-returning on prior errors for 5 mins.
- Confirm we don’t trigger SNS for Base addresses, and ensure only unique Solana addresses per render call SNS once.

4. UI resilience
- Keep current priority order and loading state; if SNS fails (403/422), show truncated address and do not spam logs.
- Optionally add a small `title` attribute showing “Name lookup failed” in dev mode only.

## Testing
- Set the env RPC and rebuild; verify Leaderboard entries with Solana chain show `.sol` when owned.
- Validate headers in SocialDashboard and MyPassport show the `.sol` badge.
- Confirm that disabling the env var reproduces the 403 and we fall back gracefully.

## Deliverables
- Conditional SNS gating in `useDisplayName`.
- Environment variable configured for mainnet RPC.
- Verified Leaderboard and headers render `.sol` names when available and degrade cleanly otherwise.