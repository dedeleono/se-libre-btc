import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

import type { Metadata } from "next";

import Providers from "./providers";
import DatabaseErrorBoundary from "@/components/database-error-boundary";
import ThemeProvider from "@/components/layout/ThemeToggle/theme-provider";
import { SkipLink } from "@/components/layout/skip-link";
import { getServerLocale, getServerMessages } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Dinero Libre",
  description: "Dinero Libre - Sé dueño de tu futuro",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const t = await getServerMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased overflow-x-hidden w-full">
        <SkipLink label={t.common.skipToContent} />
        <Providers initialLocale={locale}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <DatabaseErrorBoundary>
              {children}
            </DatabaseErrorBoundary>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
