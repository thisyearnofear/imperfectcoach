"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import { config } from "@/wagmi";
import { UserProvider } from "@/contexts/UserContext";

export function Web3Providers(props: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <UserProvider options={{ requireSiwe: true, enableSmartRefresh: true }}>
          {props.children}
        </UserProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
