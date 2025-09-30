"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import type { Session } from "next-auth";

import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { CookieBanner } from "@/components/layout/cookie-banner";

type AppProvidersProps = {
  children: React.ReactNode;
  session?: Session | null;
};

export function AppProviders({ children, session }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        {children}
        <CookieBanner />
        <AnalyticsScripts />
      </QueryClientProvider>
    </SessionProvider>
  );
}
