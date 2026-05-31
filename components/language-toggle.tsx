"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LanguageToggleProps = {
  className?: string;
};

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { locale, setLocale, t } = useLocale();
  const nextLocale = locale === "es" ? "en" : "es";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={`${t.languageLabel}: ${locale.toUpperCase()}`}
      onClick={() => setLocale(nextLocale)}
      className={cn("gap-2 px-2", className)}
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-semibold uppercase">{locale}</span>
    </Button>
  );
}
