"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Heart, Mail } from "lucide-react";
import GuateLibreLogo from "@/components/guate-libre-logo";
import { useLocale } from "@/lib/i18n";

export function GuateLibreFooter() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <Card className="border-2 border-foreground bg-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <GuateLibreLogo width={140} />
          <p className="max-w-sm text-xs text-muted-foreground">
            {t.completion.guateLibreTagline}
          </p>
        </div>

        <nav
          aria-label="Guate Libre"
          className="flex flex-wrap items-center gap-2"
        >
          <Button asChild variant="outline" size="sm">
            <a
              href="https://www.guatelibre.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="mr-2 h-4 w-4" />
              {t.completion.guateLibreVisit}
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a
              href="https://www.guatelibre.org/donar"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Heart className="mr-2 h-4 w-4" />
              {t.completion.guateLibreDonate}
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="mailto:info@guatelibre.org">
              <Mail className="mr-2 h-4 w-4" />
              {t.completion.guateLibreContact}
            </a>
          </Button>
        </nav>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {t.completion.guateLibreRights(year)}
      </p>
    </Card>
  );
}
