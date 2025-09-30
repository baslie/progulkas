"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import type { Session } from "next-auth";

type AppProvidersProps = {
  children: React.ReactNode;
  session?: Session | null;
};

export function AppProviders({ children, session }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
