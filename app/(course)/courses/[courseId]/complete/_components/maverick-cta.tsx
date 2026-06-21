"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Phone } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function MaverickCta() {
  const { t } = useLocale();
  return (
    <Card className="border-2 border-foreground bg-[var(--volcan-900)] p-8 text-[var(--crema-050)] shadow-[var(--shadow-block-naranja)]">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--naranja-500)]">
        {t.completion.maverickKicker}
      </p>
      <h2 className="mt-2 font-[var(--font-display)] text-3xl uppercase leading-tight">
        {t.completion.maverickTitle}
      </h2>
      <p className="mt-3 text-xl font-semibold">{t.completion.maverickPartner}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="bg-[var(--naranja-500)] text-[var(--volcan-900)] hover:bg-[var(--naranja-600)]">
          <a href="https://maverickcapitalinvestment.com" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            {t.completion.maverickWebsiteCta}
          </a>
        </Button>
        <Button asChild size="lg" variant="outline" className="border-[var(--crema-050)] bg-transparent text-[var(--crema-050)] hover:bg-[var(--volcan-500)]">
          <a href="tel:+50232065088">
            <Phone className="mr-2 h-4 w-4" />
            +502 3206-5088
          </a>
        </Button>
      </div>

      <p className="mt-4 text-xs text-[var(--crema-200)]">{t.completion.maverickDisclaimer}</p>
    </Card>
  );
}
