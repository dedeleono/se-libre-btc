"use client";

import { useLocale } from "@/lib/i18n";
import { formatSats, formatBtc } from "@/lib/wallet-sim/format";

export function BalanceDisplay({ balanceSats, locale }: { balanceSats: number; locale: string }) {
  const { t } = useLocale();
  return (
    <div className="rounded-md border-2 border-foreground bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {t.walletSim.balanceLabel}
      </p>
      <p className="text-2xl font-bold">{formatSats(balanceSats, locale)}</p>
      <p className="text-sm text-muted-foreground">{formatBtc(balanceSats, locale)} BTC</p>
    </div>
  );
}
