"use client";

import { QRCodeSVG } from "qrcode.react";
import { useLocale } from "@/lib/i18n";

export function QrCode({ value, size = 192 }: { value: string; size?: number }) {
  const { t } = useLocale();
  return (
    <div
      role="img"
      aria-label={t.walletSim.qrAriaLabel}
      className="w-fit rounded-md border-2 border-foreground bg-white p-3"
    >
      <QRCodeSVG value={value} size={size} />
    </div>
  );
}
