## Root Causes
- Browser 403s to `api.mainnet-beta.solana.com` indicate the fallback RPC is still being used; your `VITE_SOLANA_MAINNET_RPC_URL` may not be applied (quotes/backticks or dev server not restarted).
- Header code passes the EVM `address` into `.sol` resolution; it must use the Solana public key.

## Fixes
1. Ensure Env Applied
- In `.env`/`.env.local`, remove backticks: `VITE_SOLANA_MAINNET_RPC_URL=https://rpc.helius.xyz/?api-key=...`.
- Fully restart the dev server so Vite picks up the new `VITE_` value (envs are baked at build time).

2. Use Solana Address in Headers
- SocialDashboard: swap `.sol` resolution to use `solanaPublicKey?.toString()` from `useSolanaWalletAdapter()` rather than `wagmi` EVM `address`.
  - File: `src/components/SocialDashboard.tsx`.
  - Change: import `useSolanaWalletAdapter`, call the hook, pass `solanaPublicKey?.toString()` into `useSolanaNameService`.
- MyPassport: same change for the `.sol` badge.
  - File: `src/components/MyPassport.tsx`.
  - Change: pass `solanaPublicKey?.toString()` to `useSolanaNameService`.

3. Keep SNS Calls Efficient
- Already gated: run SNS only when no social identity and no basename are present, and chain is `solana`.
- Maintain 5-min cache to prevent repeated calls.

## Validation
- After updating env and swapping to Solana address in headers, rebuild and run.
- Verify Leaderboard shows `.sol` for Solana entries with domains.
- Verify SocialDashboard/MyPassport headers show `papajams.sol` when Solana wallet is connected.

## Contingency
- If RPC still 403s, swap to another provider (QuickNode) or add a thin server proxy to make SNS requests server-side to avoid browser CORS limits.
- Optionally add a dev-only log showing which RPC URL is in use to confirm env application.