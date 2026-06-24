"use client";

import { useId } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";

export function AddressDisplay({
  address,
  label,
  hint,
}: {
  address: string;
  /** Optional visible label rendered above the address box. */
  label?: string;
  /** Optional helper text rendered below the address box. */
  hint?: string;
}) {
  const { t } = useLocale();
  const hintId = useId();

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    toast.success(t.walletSim.addressCopied);
  };

  return (
    <div className="space-y-1">
      {label && <p className="text-sm font-semibold">{label}</p>}
      <div className="flex items-center gap-2 rounded-md border-2 border-foreground bg-card p-2">
        {/* Full address is always rendered (break-all) so users can read/verify it,
            while staying tidy and responsive. */}
        <code
          className="grow break-all font-mono text-sm"
          title={address}
          aria-describedby={hint ? hintId : undefined}
        >
          {address}
        </code>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="shrink-0 self-start"
          onClick={copy}
          aria-label={t.walletSim.copyAddress}
          title={t.walletSim.copyAddress}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}
