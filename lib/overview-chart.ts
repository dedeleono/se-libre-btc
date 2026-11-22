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

const NICE_STEPS = [1, 2, 5, 10];

/** Axis ticks from 0 to just past `max`, stepping by 1, 2 or 5 × 10ⁿ in about `intervals` steps. */
export function niceTicks(max: number, options: { integer?: boolean; intervals?: number } = {}): number[] {
  if (max <= 0) return [0];
  const raw = max / (options.intervals ?? 4);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  let step = Number(((NICE_STEPS.find((m) => m * magnitude >= raw) ?? 10) * magnitude).toPrecision(12));
  if (options.integer) step = Math.max(1, step);
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => Number((i * step).toPrecision(12)));
}

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
