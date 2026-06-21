"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import type { Phase } from "@/lib/wallet-sim/types";

export function PhaseStepper({
  phases,
  current,
  reached,
}: {
  phases: Phase[];
  current: Phase;
  reached: Phase[];
}) {
  const { t } = useLocale();
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label={t.walletSim.stepperLabel}>
      {phases.map((phase, i) => {
        const isCurrent = phase === current;
        const isReached = reached.includes(phase);
        return (
          <li
            key={phase}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md border-2 px-3 py-1 text-xs font-bold uppercase tracking-wide",
              isCurrent
                ? "border-foreground bg-foreground text-background"
                : isReached
                  ? "border-foreground bg-secondary text-foreground"
                  : "border-muted text-muted-foreground"
            )}
          >
            <span>{i + 1}</span>
            <span>{t.walletSim.phases[phase]}</span>
          </li>
        );
      })}
    </ol>
  );
}
