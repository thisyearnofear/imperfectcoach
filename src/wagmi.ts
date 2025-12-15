import { http } from "wagmi";
import { baseSepolia, avalancheFuji } from "wagmi/chains";
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// App logo URL - use production URL if available, otherwise localhost with common dev port
const APP_LOGO_URL = import.meta.env.VITE_APP_URL
  ? `${import.meta.env.VITE_APP_URL}/IC.png`
  : 'http://localhost:8080/IC.png';

// Get WalletConnect project ID from environment
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "public";

// Unified config using RainbowKit's getDefaultConfig
// This handles connectors (including Coinbase Wallet) and client configuration automatically
export const config = getDefaultConfig({
  appName: "Imperfect Coach - AI Fitness Tracker",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [baseSepolia, avalancheFuji],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(
      import.meta.env.VITE_BASE_SEPOLIA_RPC_URL ||
      "https://sepolia.base.org"
    ),
    [avalancheFuji.id]: http(
      import.meta.env.VITE_AVALANCHE_FUJI_RPC_URL ||
      "https://api.avax-test.network/ext/bc/C/rpc"
    ),
  },
});

// Solana configuration - separate from wagmi for now
export const solanaConfig = {
  network: (import.meta.env.VITE_SOLANA_NETWORK as 'devnet' | 'testnet' | 'mainnet-beta') || 'devnet',
  rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  treasuryAddress: import.meta.env.VITE_SOLANA_TREASURY_ADDRESS || 'CmGgLQL36Y9ubtTsy2zmE46TAxwCBm66onZmPPhUWNqv',
};

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
