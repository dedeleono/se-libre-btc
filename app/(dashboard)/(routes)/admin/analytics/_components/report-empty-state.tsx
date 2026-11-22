"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";

export function ReportEmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  const { t } = useLocale();
  const a = t.analytics;

  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 py-4">
        <BarChart3 className="size-6 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-lg font-bold text-balance">{filtered ? a.emptyFilteredTitle : a.emptyTitle}</h2>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          {filtered ? a.emptyFilteredBody : a.emptyBody}
        </p>
        {filtered ? (
          <button type="button" onClick={onClear} className={buttonVariants({ variant: "outline" })}>
            {a.clearFilters}
          </button>
        ) : (
          <Link href="/admin/courses" className={buttonVariants({ variant: "outline" })}>
            {a.viewCourses}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
