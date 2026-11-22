"use client";

import * as React from "react";

import { useLocale } from "@/lib/i18n";
import type { Cell, Percent } from "@/lib/reports/publish";

export function useReportFormat(threshold: number) {
  const { locale, t } = useLocale();

  return React.useMemo(() => {
    const number = new Intl.NumberFormat(locale);
    const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
    const month = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
    const monthYear = new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: "UTC" });
    const monthDate = (key: string) => new Date(`${key}-15T12:00:00Z`);

    return {
      t,
      locale,
      cellText: (cell: Cell) => (cell.kind === "suppressed" ? `<${threshold}` : number.format(cell.value)),
      percentText: (value: Percent) => (value === null ? "—" : percent.format(value / 100)),
      monthShort: (key: string) => month.format(monthDate(key)),
      monthLong: (key: string) => monthYear.format(monthDate(key)),
    };
  }, [locale, t, threshold]);
}

export function CellValue({ cell, threshold }: { cell: Cell; threshold: number }) {
  const { t, cellText } = useReportFormat(threshold);
  if (cell.kind === "value") return <>{cellText(cell)}</>;

  const explanation = t.analytics.suppressedExplanation(threshold);
  return (
    <span title={explanation}>
      <span aria-hidden="true">{cellText(cell)}</span>
      <span className="sr-only">{explanation}</span>
    </span>
  );
}

export function PercentValue({ value }: { value: Percent }) {
  const { t, percentText } = useReportFormat(0);
  if (value !== null) return <>{percentText(value)}</>;

  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{t.analytics.notAvailable}</span>
    </>
  );
}
