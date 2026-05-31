"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LoadingProvider } from "@/components/providers/loading-provider";
import { LocaleProvider, type Locale } from "@/lib/i18n";

export default function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider initialLocale={initialLocale}>
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
