import { http, createConfig } from "wagmi";
import { base, baseSepolia, avalanche, avalancheFuji } from "wagmi/chains";
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// App logo URL - use production URL if available, otherwise localhost with common dev port
const APP_LOGO_URL = import.meta.env.VITE_APP_URL 
  ? `${import.meta.env.VITE_APP_URL}/IC.png`
  : 'http://localhost:8080/IC.png';

// Get WalletConnect project ID from environment
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

// Connectors that support Base and Avalanche (EVM-compatible)
export const cbWalletConnector = coinbaseWallet({
  appName: "Imperfect Coach - AI Fitness Tracker",
  appLogoUrl: APP_LOGO_URL,
  preference: "smartWalletOnly",
});

export const metaMaskConnector = metaMask({
  dappMetadata: {
    name: "Imperfect Coach - AI Fitness Tracker",
    url: import.meta.env.VITE_APP_URL || "http://localhost:5173",
  },
});

export const walletConnectConnector = walletConnect({
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: "Imperfect Coach - AI Fitness Tracker",
    description: "AI-powered fitness coaching on Base, Solana, and Avalanche",
    url: import.meta.env.VITE_APP_URL || "http://localhost:5173",
    icons: [APP_LOGO_URL],
  },
});

// RainbowKit configuration for EVM wallet path (Base + Avalanche)
export const rainbowkitConfig = getDefaultConfig({
  appName: 'Imperfect Coach',
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

// Legacy wagmi config for smart account path (Coinbase only)
export const config = createConfig({
  chains: [base, baseSepolia, avalanche, avalancheFuji],
  // turn off injected provider discovery
  multiInjectedProviderDiscovery: false,
  connectors: [cbWalletConnector, metaMaskConnector, walletConnectConnector],
  ssr: true,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(
      import.meta.env.VITE_BASE_SEPOLIA_RPC_URL ||
        "https://sepolia.base.org"
    ),
    [avalanche.id]: http(),
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
