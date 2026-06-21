"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { buildRecap } from "@/lib/wallet-sim/simulation";
import { formatSats } from "@/lib/wallet-sim/format";
import type { SimulatorState } from "@/lib/wallet-sim/types";
import type { WalletSimActions } from "../use-wallet-simulator";
import { PracticeBanner } from "../presentational/practice-banner";

export function RecapPanel({
  state,
  actions,
  locale,
  canComplete,
}: {
  state: SimulatorState;
  actions: WalletSimActions;
  locale: string;
  canComplete: boolean;
}) {
  const { t } = useLocale();
  const recap = buildRecap(state);
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{t.walletSim.recap.title}</h3>
      <PracticeBanner />
      <ul className="space-y-1 text-sm">
        <li>{t.walletSim.recap.received}: {formatSats(recap.receivedSats, locale)}</li>
        <li>{t.walletSim.recap.sent}: {formatSats(recap.sentSats, locale)}</li>
        <li>{t.walletSim.recap.finalBalance}: {formatSats(recap.finalBalanceSats, locale)}</li>
        <li>{t.walletSim.recap.txCount}: {recap.txCount}</li>
      </ul>
      {canComplete && <Button onClick={actions.complete}>{t.walletSim.recap.markComplete}</Button>}
    </div>
  );
}
