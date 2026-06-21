"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export function SeedPhraseGrid({ words, revealed }: { words: string[]; revealed: boolean }) {
  const { t } = useLocale();
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4" aria-label={t.walletSim.seedGridLabel}>
      {words.map((word, i) => (
        <li
          key={i}
          className="flex items-center gap-2 rounded-md border-2 border-foreground bg-card px-3 py-2 text-sm"
        >
          <span className="text-muted-foreground">{i + 1}.</span>
          <span className={cn("font-mono font-semibold", !revealed && "select-none blur-sm")}>
            {revealed ? word : "••••••"}
          </span>
        </li>
      ))}
    </ol>
  );
}
