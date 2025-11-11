import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";
// TODO: Add Solana support when wagmi supports it
// For now, we'll handle Solana separately in payment modules

export const cbWalletConnector = coinbaseWallet({
  appName: "Imperfect Coach - AI Fitness Tracker",
  appLogoUrl: import.meta.env.VITE_APP_URL + "/IC.png",
  preference: "smartWalletOnly",
});

export const config = createConfig({
  chains: [base, baseSepolia],
  // turn off injected provider discovery
  multiInjectedProviderDiscovery: false,
  connectors: [cbWalletConnector],
  ssr: true,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(
      import.meta.env.VITE_BASE_SEPOLIA_RPC_URL ||
        "https://sepolia.base.org"
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
