import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

import type { Metadata } from "next";

import Providers from "./providers";
import DatabaseErrorBoundary from "@/components/database-error-boundary";
import ThemeProvider from "@/components/layout/ThemeToggle/theme-provider";

export const metadata: Metadata = {
  title: "Se Libre",
  description: "Se Libre - Se dueño de tu futuro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="es">
        <body className="min-h-screen flex flex-col antialiased overflow-x-hidden w-full">
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <DatabaseErrorBoundary>
              {children}
            </DatabaseErrorBoundary>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </Providers>
  );
}
