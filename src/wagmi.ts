import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

export const cbWalletConnector = coinbaseWallet({
  appName: "Imperfect Coach - AI Fitness Tracker",
  appLogoUrl: import.meta.env.VITE_APP_URL + "/logo.png",
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
        "https://base-sepolia.g.alchemy.com/v2/L69xEIR9jJjLmdvq798gQCQ1Rq8GI4I2",
    ),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
