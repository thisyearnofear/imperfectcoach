"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, lightTheme, darkTheme } from "@rainbow-me/rainbowkit";
import '@rainbow-me/rainbowkit/styles.css';

import { config } from "@/wagmi";
import { UserProvider } from "@/contexts/UserContext";
import { SolanaProvider } from "@/integrations/SolanaProvider";

export function Web3Providers(props: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={lightTheme()}>
          <SolanaProvider>
            <UserProvider options={{ requireSiwe: false, enableSmartRefresh: true }}>
              {props.children}
            </UserProvider>
          </SolanaProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
