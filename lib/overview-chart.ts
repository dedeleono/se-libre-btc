import { OVERVIEW_TIME_ZONE } from "./overview-buckets";

export type OverviewRow = { monthStart: string; revenue: number; students: number; courses: number };
export type OverviewMetric = Exclude<keyof OverviewRow, "monthStart">;

export function overviewMonthLabel(iso: string, locale: string, style: "short" | "long"): string {
  return new Intl.DateTimeFormat(
    locale,
    style === "short"
      ? { month: "short", timeZone: OVERVIEW_TIME_ZONE }
      : { month: "long", year: "numeric", timeZone: OVERVIEW_TIME_ZONE },
  ).format(new Date(iso));
}

// es-GT in every locale so the axis prints the currency the way formatPrice does in the tooltip.
const revenueTickFormat = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  notation: "compact",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export const revenueTick = (value: number) => revenueTickFormat.format(value);

export function toOverviewRows(input: {
  monthStarts: Date[];
  revenueCents: number[];
  students: number[];
  courses: number[];
}): OverviewRow[] {
  return input.monthStarts.map((monthStart, i) => ({
    monthStart: monthStart.toISOString(),
    revenue: input.revenueCents[i] / 100,
    students: input.students[i],
    courses: input.courses[i],
  }));
}

export const isAllZero = (rows: OverviewRow[], metrics: OverviewMetric[]) =>
  rows.every((row) => metrics.every((metric) => row[metric] === 0));
