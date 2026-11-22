"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";

export default function AdminAnalyticsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLocale();

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-4" role="alert">
          <h1 className="text-xl font-bold text-balance">{t.common.somethingWentWrong}</h1>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">{t.analytics.loadError}</p>
          <Button type="button" variant="outline" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            {t.common.retry}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
