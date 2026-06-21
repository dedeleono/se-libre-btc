"use client";

import { AlertTriangle } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function PracticeBanner() {
  const { t } = useLocale();
  return (
    <div
      role="note"
      className="flex items-center gap-2 rounded-md border-2 border-foreground bg-secondary p-3 text-sm font-semibold"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{t.walletSim.practiceBanner}</span>
    </div>
  );
}
