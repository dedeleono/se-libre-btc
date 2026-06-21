"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { canAdvance } from "@/lib/wallet-sim/simulation";
import type { SimulatorState } from "@/lib/wallet-sim/types";
import type { WalletSimActions } from "../use-wallet-simulator";
import { SeedPhraseGrid } from "../presentational/seed-phrase-grid";

export function BackupPanel({ state, actions }: { state: SimulatorState; actions: WalletSimActions; locale: string }) {
  const { t } = useLocale();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const words = state.wallet?.mnemonic.split(" ") ?? [];
  const positions = state.backup.challenge?.positions ?? [];
  const wrong = state.backup.result && !state.backup.result.ok ? state.backup.result.wrongPositions : [];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{t.walletSim.backup.title}</h3>
      <p className="text-sm text-muted-foreground">{t.walletSim.backup.intro}</p>

      <Button type="button" variant="outline" size="sm" onClick={actions.toggleReveal}>
        {state.backup.revealed ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
        {state.backup.revealed ? t.walletSim.backup.hide : t.walletSim.backup.reveal}
      </Button>
      <SeedPhraseGrid words={words} revealed={state.backup.revealed} />

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={state.backup.acknowledgedWritten}
          onCheckedChange={(v) => actions.ackWritten(Boolean(v))}
        />
        {t.walletSim.backup.acknowledge}
      </label>

      {state.backup.acknowledgedWritten && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">{t.walletSim.backup.challengePrompt}</p>
          {positions.map((pos) => (
            <div key={pos} className="space-y-1">
              <Label htmlFor={`word-${pos}`}>{t.walletSim.backup.wordNumber(pos + 1)}</Label>
              <Input
                id={`word-${pos}`}
                value={answers[pos] ?? ""}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={wrong.includes(pos)}
                onChange={(e) => setAnswers((a) => ({ ...a, [pos]: e.target.value }))}
              />
            </div>
          ))}
          <Button onClick={() => actions.submitBackup(answers)}>{t.walletSim.backup.verify}</Button>
          {state.backup.result && !state.backup.result.ok && (
            <p className="text-sm text-destructive">{t.walletSim.backup.incorrect}</p>
          )}
        </div>
      )}

      {state.backup.verified && (
        <Button onClick={actions.next} disabled={!canAdvance(state)}>
          {t.walletSim.backup.continue}
        </Button>
      )}
    </div>
  );
}
