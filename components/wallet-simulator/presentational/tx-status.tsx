"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n";
import { formatSats, truncateAddress } from "@/lib/wallet-sim/format";
import type { SimTx } from "@/lib/wallet-sim/types";
import { ConfirmationMeter } from "./confirmation-meter";

export function TxStatus({ tx, locale }: { tx: SimTx; locale: string }) {
  const { t } = useLocale();
  return (
    <div role="status" aria-live="polite" className="space-y-2 rounded-md border-2 border-foreground bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          {tx.direction === "in" ? t.walletSim.txIncoming : t.walletSim.txOutgoing}
        </span>
        <Badge variant={tx.status === "confirmed" ? "default" : "secondary"}>
          {tx.status === "confirmed" ? t.walletSim.txConfirmed : t.walletSim.txPending}
        </Badge>
      </div>
      <p className="text-sm">{formatSats(tx.amountSats, locale)}</p>
      <p className="text-xs text-muted-foreground">
        {t.walletSim.txCounterparty}: {truncateAddress(tx.counterpartyAddress)}
      </p>
      {tx.status === "pending" && (
        <ConfirmationMeter confirmations={tx.confirmations} required={tx.requiredConfirmations} />
      )}
    </div>
  );
}
