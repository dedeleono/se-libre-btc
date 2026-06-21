"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { truncateAddress } from "@/lib/wallet-sim/format";

export function AddressDisplay({ address }: { address: string }) {
  const { t } = useLocale();
  const copy = async () => {
    await navigator.clipboard.writeText(address);
    toast.success(t.walletSim.addressCopied);
  };
  return (
    <div className="flex items-center gap-2 rounded-md border-2 border-foreground bg-card p-2">
      <code className="grow truncate font-mono text-sm" title={address}>
        {truncateAddress(address)}
      </code>
      <span className="sr-only">{address}</span>
      <Button type="button" size="sm" variant="ghost" onClick={copy} aria-label={t.walletSim.copyAddress}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
