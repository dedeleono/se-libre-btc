import { describe, it, expect } from "vitest";
import { overviewWindow, bucketByMonth } from "./overview-buckets";

const at = (iso: string) => new Date(iso);
const row = (iso: string, value = 1) => ({ date: at(iso), value });

describe("overviewWindow", () => {
  it("covers the 12 Guatemala-time months ending with the current one", () => {
    const { start, end, monthStarts } = overviewWindow(at("2026-11-17T12:00:00Z"));
    expect(start).toEqual(at("2025-12-01T00:00:00.000-06:00"));
    expect(end).toEqual(at("2026-12-01T00:00:00.000-06:00"));
    expect(monthStarts).toHaveLength(12);
    expect(monthStarts[0]).toEqual(at("2025-12-01T00:00:00-06:00"));
    expect(monthStarts[11]).toEqual(at("2026-11-01T00:00:00-06:00"));
  });

  it("rolls over from December to January", () => {
    const { start, end, monthStarts } = overviewWindow(at("2027-01-05T08:00:00Z"));
    expect(start).toEqual(at("2026-02-01T00:00:00-06:00"));
    expect(end).toEqual(at("2027-02-01T00:00:00-06:00"));
    expect(monthStarts[10]).toEqual(at("2026-12-01T00:00:00-06:00"));
    expect(monthStarts[11]).toEqual(at("2027-01-01T00:00:00-06:00"));
  });

  it("starts a new month at Guatemala midnight on the 1st", () => {
    expect(overviewWindow(at("2026-03-01T00:00:00-06:00")).monthStarts[11]).toEqual(
      at("2026-03-01T00:00:00-06:00"),
    );
    expect(overviewWindow(at("2026-02-28T23:59:59.999-06:00")).monthStarts[11]).toEqual(
      at("2026-02-01T00:00:00-06:00"),
    );
  });
});

describe("bucketByMonth", () => {
  const now = at("2026-11-17T12:00:00Z");

  it("returns twelve zeros for no rows", () => {
    expect(bucketByMonth([], now)).toEqual(new Array(12).fill(0));
  });

  it("counts the whole last day of a month", () => {
    const buckets = bucketByMonth([row("2026-10-31T15:00:00-06:00")], now);
    expect(buckets[10]).toBe(1);
  });

  it("counts a late-evening Guatemala payment in its local month, not the next UTC month", () => {
    const buckets = bucketByMonth([row("2026-10-31T23:30:00-06:00")], now);
    expect(at("2026-10-31T23:30:00-06:00")).toEqual(at("2026-11-01T05:30:00Z"));
    expect(buckets[10]).toBe(1);
    expect(buckets[11]).toBe(0);
  });

  it("counts the last millisecond of a month in that month", () => {
    const buckets = bucketByMonth([row("2026-11-30T23:59:59.999-06:00")], now);
    expect(buckets[11]).toBe(1);
  });

  it("uses half-open month boundaries", () => {
    const buckets = bucketByMonth(
      [
        row("2026-11-01T00:00:00.000-06:00", 1),
        row("2025-12-01T00:00:00.000-06:00", 10),
        row("2025-11-30T23:59:59.999-06:00", 100),
        row("2026-12-01T00:00:00.000-06:00", 1000),
      ],
      now,
    );
    expect(buckets[10]).toBe(0);
    expect(buckets[11]).toBe(1);
    expect(buckets[0]).toBe(10);
    expect(buckets.reduce((sum, value) => sum + value, 0)).toBe(11);
  });

  it("buckets across a December to January rollover", () => {
    const buckets = bucketByMonth(
      [row("2026-12-31T23:30:00-06:00", 1), row("2027-01-01T00:00:00-06:00", 2)],
      at("2027-01-05T08:00:00Z"),
    );
    expect(buckets[10]).toBe(1);
    expect(buckets[11]).toBe(2);
  });

  it("sums values in the same month", () => {
    const buckets = bucketByMonth(
      [
        row("2026-06-02T10:00:00-06:00", 1250),
        row("2026-06-15T10:00:00-06:00", 999),
        row("2026-06-30T23:00:00-06:00", 1),
      ],
      now,
    );
    expect(buckets[6]).toBe(2250);
  });
});
