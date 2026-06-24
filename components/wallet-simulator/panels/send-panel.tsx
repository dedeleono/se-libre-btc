"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { canAdvance } from "@/lib/wallet-sim/simulation";
import { SAMPLE_COUNTERPARTY, type SimulatorState } from "@/lib/wallet-sim/types";
import type { WalletSimActions } from "../use-wallet-simulator";
import { FeeSelector } from "../presentational/fee-selector";
import { BalanceDisplay } from "../presentational/balance-display";
import { TxStatus } from "../presentational/tx-status";
import { AddressDisplay } from "../presentational/address-display";

export function SendPanel({ state, actions, locale }: { state: SimulatorState; actions: WalletSimActions; locale: string }) {
  const { t } = useLocale();
  const outgoing = state.transactions.find((tx) => tx.direction === "out");
  const { draft, errors, broadcasted } = state.send;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{t.walletSim.send.title}</h3>
      <p className="text-sm text-muted-foreground">{t.walletSim.send.intro}</p>
      {state.wallet && <BalanceDisplay balanceSats={state.wallet.balanceSats} locale={locale} />}

      {!broadcasted && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="to-address">{t.walletSim.send.toAddress}</Label>
            <Input
              id="to-address"
              value={draft.toAddress}
              placeholder="tb1q..."
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => actions.updateDraft({ toAddress: e.target.value })}
            />
            {errors.toAddress && <p className="text-sm text-destructive">{t.walletSim.send.errors[errors.toAddress]}</p>}
            {/* Copyable sample destination so users aren't stuck for a valid
                testnet address to paste above. */}
            <AddressDisplay address={SAMPLE_COUNTERPARTY} label={t.walletSim.txCounterparty} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="amount">{t.walletSim.send.amount}</Label>
            <Input
              id="amount"
              inputMode="decimal"
              value={draft.amountSats ?? ""}
              onChange={(e) => {
                const n = e.target.value.trim() === "" ? null : Number(e.target.value);
                actions.updateDraft({ amountSats: Number.isNaN(n as number) ? null : n });
              }}
            />
            {errors.amount && <p className="text-sm text-destructive">{t.walletSim.send.errors[errors.amount]}</p>}
          </div>
          <FeeSelector value={draft.feeLevel} onChange={(l) => actions.updateDraft({ feeLevel: l })} locale={locale} />
          <Button onClick={actions.submitSend} disabled={hasErrors || !draft.toAddress?.trim() || draft.amountSats == null}>
            {t.walletSim.send.broadcast}
          </Button>
        </div>
      )}

      {outgoing && <TxStatus tx={outgoing} locale={locale} />}
      <Button onClick={actions.next} disabled={!canAdvance(state)}>
        {t.walletSim.send.continue}
      </Button>
    </div>
  );
}
