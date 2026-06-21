"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { canAdvance } from "@/lib/wallet-sim/simulation";
import type { SimulatorState } from "@/lib/wallet-sim/types";
import type { WalletSimActions } from "../use-wallet-simulator";
import { AddressDisplay } from "../presentational/address-display";
import { QrCode } from "../presentational/qr-code";
import { BalanceDisplay } from "../presentational/balance-display";
import { TxStatus } from "../presentational/tx-status";

export function ReceivePanel({ state, actions, locale }: { state: SimulatorState; actions: WalletSimActions; locale: string }) {
  const { t } = useLocale();
  const incoming = state.transactions.find((tx) => tx.direction === "in");
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{t.walletSim.receive.title}</h3>
      <p className="text-sm text-muted-foreground">{t.walletSim.receive.intro}</p>
      {state.wallet && (
        <>
          <QrCode value={state.wallet.address} />
          <AddressDisplay address={state.wallet.address} />
          <BalanceDisplay balanceSats={state.wallet.balanceSats} locale={locale} />
        </>
      )}
      {!incoming && <Button onClick={actions.simulateIncoming}>{t.walletSim.receive.simulate}</Button>}
      {incoming && <TxStatus tx={incoming} locale={locale} />}
      <Button onClick={actions.next} disabled={!canAdvance(state)}>
        {t.walletSim.receive.continue}
      </Button>
    </div>
  );
}
