"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

import { useLocale } from "@/lib/i18n";

const Toaster = ({ position = "top-center", ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const { t } = useLocale();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={position}
      containerAriaLabel={t.toasts.region}
      richColors
      toastOptions={{
        className:
          "bg-popover text-popover-foreground border border-border rounded-md shadow-lg backdrop-blur-sm",
      }}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
