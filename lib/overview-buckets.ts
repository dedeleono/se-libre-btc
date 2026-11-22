export const OVERVIEW_MONTHS = 12;
export const OVERVIEW_TIME_ZONE = "America/Guatemala";
export const GUATEMALA_UTC_OFFSET_HOURS = -6;

const OFFSET_MS = GUATEMALA_UTC_OFFSET_HOURS * 60 * 60 * 1000;

export type OverviewWindow = { start: Date; end: Date; monthStarts: Date[] };

function localMonthIndex(instant: Date): number {
  const local = new Date(instant.getTime() + OFFSET_MS);
  return local.getUTCFullYear() * 12 + local.getUTCMonth();
}

function localMonthStart(monthIndex: number): Date {
  const year = Math.floor(monthIndex / 12);
  return new Date(Date.UTC(year, monthIndex - year * 12, 1, -GUATEMALA_UTC_OFFSET_HOURS));
}

export function overviewWindow(now: Date): OverviewWindow {
  const current = localMonthIndex(now);
  const monthStarts = Array.from({ length: OVERVIEW_MONTHS }, (_, i) =>
    localMonthStart(current - (OVERVIEW_MONTHS - 1) + i),
  );
  return { start: monthStarts[0], end: localMonthStart(current + 1), monthStarts };
}

export function bucketByMonth(rows: ReadonlyArray<{ date: Date; value: number }>, now: Date): number[] {
  const { start, end } = overviewWindow(now);
  const buckets = new Array<number>(OVERVIEW_MONTHS).fill(0);
  const startIndex = localMonthIndex(start);
  for (const row of rows) {
    if (row.date < start || row.date >= end) continue;
    buckets[localMonthIndex(row.date) - startIndex] += row.value;
  }
  return buckets;
}
