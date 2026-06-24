"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import type { SimulatorState } from "@/lib/wallet-sim/types";
import type { WalletSimActions } from "../use-wallet-simulator";
import { SeedPhraseGrid } from "../presentational/seed-phrase-grid";

export function CreatePanel({ state, actions }: { state: SimulatorState; actions: WalletSimActions }) {
  const { t } = useLocale();
  const words = state.wallet?.mnemonic.split(" ") ?? [];
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{t.walletSim.create.title}</h3>
      <p className="text-sm text-muted-foreground">{t.walletSim.create.intro}</p>
      {!state.wallet ? (
        <Button onClick={actions.generate} disabled={state.ui.isGenerating}>
          {state.ui.isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t.walletSim.create.generate}
        </Button>
      ) : (
        <div className="space-y-4">
          <SeedPhraseGrid words={words} revealed />
          {/* The wallet address is now shown persistently above the panels
              (see WalletSimulator), so it is intentionally not repeated here. */}
          <Button onClick={actions.next}>{t.walletSim.create.continue}</Button>
        </div>
      )}
      {state.ui.error && <p className="text-sm text-destructive">{state.ui.error}</p>}
    </div>
  );
}
