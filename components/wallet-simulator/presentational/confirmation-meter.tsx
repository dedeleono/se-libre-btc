"use client";

import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n";

export function ConfirmationMeter({ confirmations, required }: { confirmations: number; required: number }) {
  const { t } = useLocale();
  const pct = required > 0 ? Math.min(100, (confirmations / required) * 100) : 0;
  return (
    <div>
      <Progress
        value={pct}
        aria-valuenow={confirmations}
        aria-valuemin={0}
        aria-valuemax={required}
        className="h-2"
      />
      <span className="sr-only">{t.walletSim.confirmationsCount(confirmations, required)}</span>
      <span aria-hidden className="text-xs text-muted-foreground">
        {t.walletSim.confirmationsCount(confirmations, required)}
      </span>
    </div>
  );
}
