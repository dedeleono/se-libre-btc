"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n";
import { FEE_TABLE, type FeeLevel } from "@/lib/wallet-sim/types";
import { formatSats } from "@/lib/wallet-sim/format";

const LEVELS: FeeLevel[] = ["low", "med", "high"];

export function FeeSelector({
  value,
  onChange,
  locale,
}: {
  value: FeeLevel;
  onChange: (l: FeeLevel) => void;
  locale: string;
}) {
  const { t } = useLocale();
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as FeeLevel)} className="grid grid-cols-3 gap-2">
      {LEVELS.map((level) => (
        <div key={level} className="flex flex-col gap-1 rounded-md border-2 border-foreground p-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value={level} id={`fee-${level}`} />
            <Label htmlFor={`fee-${level}`} className="font-bold">
              {t.walletSim.feeLevels[level]}
            </Label>
          </div>
          <span className="text-xs text-muted-foreground">{formatSats(FEE_TABLE[level].feeSats, locale)}</span>
          <span className="text-xs text-muted-foreground">{t.walletSim.feeEta[level]}</span>
        </div>
      ))}
    </RadioGroup>
  );
}
