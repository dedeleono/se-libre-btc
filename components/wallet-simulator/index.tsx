"use client";

import { Card } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";
import { PHASE_ORDER } from "@/lib/wallet-sim/types";
import { useWalletSimulator } from "./use-wallet-simulator";
import { PhaseStepper } from "./presentational/phase-stepper";
import { PracticeBanner } from "./presentational/practice-banner";
import { ResetButton } from "./presentational/reset-button";
import { CreatePanel } from "./panels/create-panel";
import { BackupPanel } from "./panels/backup-panel";
import { ReceivePanel } from "./panels/receive-panel";
import { SendPanel } from "./panels/send-panel";
import { RecapPanel } from "./panels/recap-panel";

export default function WalletSimulator({
  onLessonComplete,
}: {
  onLessonComplete?: () => void | Promise<void>;
}) {
  const { t, locale } = useLocale();
  const { state, actions } = useWalletSimulator({ onLessonComplete });

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">{t.walletSim.title}</h2>
        <ResetButton onReset={actions.reset} />
      </div>
      <PracticeBanner />
      <PhaseStepper phases={PHASE_ORDER} current={state.phase} reached={state.reachedPhases} />

      {state.phase === "create" && (
        <CreatePanel state={state} actions={actions} />
      )}
      {state.phase === "backup" && (
        <BackupPanel state={state} actions={actions} />
      )}
      {state.phase === "receive" && (
        <ReceivePanel state={state} actions={actions} locale={locale} />
      )}
      {state.phase === "send" && (
        <SendPanel state={state} actions={actions} locale={locale} />
      )}
      {state.phase === "done" && (
        <RecapPanel
          state={state}
          actions={actions}
          locale={locale}
          canComplete={Boolean(onLessonComplete)}
        />
      )}
    </Card>
  );
}
