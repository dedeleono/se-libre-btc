import { Settings } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerMessages } from "@/lib/i18n-server";

export default function AdminSettingsPage() {
  const t = getServerMessages();

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border bg-primary/10 p-3">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">{t.admin.settingsTitle}</h1>
          <p className="text-sm text-muted-foreground text-pretty">{t.admin.settingsSubtitle}</p>
        </div>
      </div>
      <Card><CardHeader><CardTitle>{t.common.comingSoon}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{t.admin.settingsComingSoonDescription}</CardContent></Card>
    </div>
  );
}
