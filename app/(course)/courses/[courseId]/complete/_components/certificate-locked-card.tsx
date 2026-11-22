import Link from "next/link";
import { LockKeyhole, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CertificateEligibility } from "@/lib/certificate-eligibility";
import { getServerMessages } from "@/lib/i18n-server";

export function CertificateLockedCard({ eligibility }: { eligibility: CertificateEligibility }) {
  const t = getServerMessages().completion;

  return (
    <Card className="border-2 border-foreground p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[2px] border-2 border-foreground bg-secondary">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="font-[var(--font-display)] text-3xl uppercase leading-none text-balance">
              {t.certificateLockedTitle}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground tabular-nums">
              {t.certificateLockedScoreDescription(eligibility.bestFinalQuizScorePercent)}
            </p>
          </div>
        </div>

        {eligibility.finalQuizHref && (
          <Button asChild className="shrink-0">
            <Link href={eligibility.finalQuizHref}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t.retryFinalQuiz}
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
