"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BadgeCheck, Phone } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function MaverickCta() {
  const { t, locale } = useLocale();

  // Tiny supporting labels (no i18n key exists for these).
  const officialPartnerLabel =
    locale === "en" ? "Official partner" : "Socio oficial";
  const callLabel = locale === "en" ? "Call now" : "Llamar ahora";

  return (
    <Card className="overflow-hidden border-2 border-foreground bg-[var(--volcan-900)] text-[var(--crema-050)] shadow-[var(--shadow-block-naranja)]">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,18rem)_1fr]">
        {/* Brand panel — logo treatment */}
        <div className="relative flex flex-col justify-center gap-5 border-b-2 border-foreground bg-[var(--volcan-700)] p-8 md:border-b-0 md:border-r-2">
          {/* subtle radial glow behind the mark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(120%_80%_at_50%_0%,rgba(247,147,26,0.18),transparent_70%)]"
          />
          <div className="relative inline-flex w-fit items-center gap-2 self-start rounded-full border-2 border-[var(--naranja-500)] bg-[var(--volcan-900)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--naranja-500)]">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {officialPartnerLabel}
          </div>

          <div className="relative flex items-center justify-center rounded-xl border-2 border-foreground bg-[var(--crema-050)] p-6 shadow-[var(--shadow-block)]">
            <Image
              src="/images/Maverick-Green.webp"
              alt={t.completion.maverickPartner}
              width={320}
              height={120}
              className="h-auto w-full max-w-[220px] object-contain"
              priority={false}
            />
          </div>

          <p className="relative text-center text-base font-bold uppercase tracking-[0.08em] text-[var(--crema-050)]">
            {t.completion.maverickPartner}
          </p>
        </div>

        {/* Content + CTAs */}
        <div className="flex flex-col justify-center gap-6 p-8 md:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--naranja-500)]">
              {t.completion.maverickKicker}
            </p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl uppercase leading-[1.05] md:text-4xl">
              {t.completion.maverickTitle}
            </h2>
          </div>

          {/* accent divider */}
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-1 w-12 rounded-full bg-[var(--naranja-500)]" />
            <span className="h-1 flex-1 rounded-full bg-[var(--volcan-500)]" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group flex-1 bg-[var(--naranja-500)] text-[var(--volcan-900)] shadow-[var(--shadow-block)] transition-transform hover:-translate-y-0.5 hover:bg-[var(--naranja-600)]"
            >
              <a
                href="https://maverickcapitalinvestment.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.completion.maverickWebsiteCta}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-[var(--crema-050)] bg-transparent text-[var(--crema-050)] transition-colors hover:bg-[var(--volcan-500)] hover:text-[var(--crema-050)]"
            >
              <a href="tel:+50232065088" aria-label={`${callLabel} +502 3206-5088`}>
                <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                +502 3206-5088
              </a>
            </Button>
          </div>

          <p className="text-xs leading-relaxed text-[var(--crema-200)]">
            {t.completion.maverickDisclaimer}
          </p>
        </div>
      </div>
    </Card>
  );
}
