"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { useLocale } from "@/lib/i18n";
import type { PublicCourseReport } from "@/lib/reports/publish";
import { hasActiveFilters, NO_REPORT_FILTERS, toSearchParams, type ReportFilters } from "@/lib/reports/report-filters";
import { cn } from "@/lib/utils";

import { BreakdownCard } from "./breakdown-card";
import { CourseTable } from "./course-table";
import { FunnelChart } from "./funnel-chart";
import { MonthlyChart } from "./monthly-chart";
import { ReportEmptyState } from "./report-empty-state";
import { ReportFiltersBar } from "./report-filters";
import { StatTiles } from "./stat-tiles";

export function AnalyticsWorkspace({
  report,
  courses,
  csvPath,
}: {
  report: PublicCourseReport;
  courses: { id: string; title: string }[];
  csvPath: string;
}) {
  const { t } = useLocale();
  const a = t.analytics;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();

  const applyFilters = (next: ReportFilters) => {
    const query = toSearchParams(next).toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };

  const query = toSearchParams(report.filters).toString();
  const isEmpty = report.tiles.students.kind === "value" && report.tiles.students.value === 0;
  const ageLabel = (key: string) => key.replace("-", "–");

  return (
    <div className="space-y-6">
      <ReportFiltersBar
        filters={report.filters}
        courses={courses}
        csvHref={query ? `${csvPath}?${query}` : csvPath}
        threshold={report.threshold}
        onChange={applyFilters}
      />

      <div
        aria-busy={pending}
        className={cn("space-y-6 transition-opacity duration-200", pending && "opacity-60")}
      >
        {isEmpty ? (
          <ReportEmptyState filtered={hasActiveFilters(report.filters)} onClear={() => applyFilters(NO_REPORT_FILTERS)} />
        ) : (
          <>
            <StatTiles report={report} />
            <FunnelChart report={report} />
            <MonthlyChart report={report} />
            <div className="grid gap-6 lg:grid-cols-2">
              <BreakdownCard title={a.ageTitle} rows={report.byAge} threshold={report.threshold} labelFor={ageLabel} />
              <BreakdownCard title={a.countryTitle} rows={report.byCountry} threshold={report.threshold} />
            </div>
            {report.byRegion && (
              <BreakdownCard title={a.regionTitle} rows={report.byRegion} threshold={report.threshold} />
            )}
            {report.byCourse.length > 0 && <CourseTable report={report} />}
          </>
        )}
      </div>
    </div>
  );
}
