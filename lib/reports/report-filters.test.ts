import { describe, expect, it } from "vitest";

import { guatemalaToday, parseReportFilters, toSearchParams } from "./report-filters";

const KNOWN = new Set(["c1"]);

describe("parseReportFilters", () => {
  it("turns Guatemala calendar days into a half-open UTC range", () => {
    const { scope, issues } = parseReportFilters({ from: "2026-03-01", to: "2026-04-30" }, KNOWN);

    expect(scope.from?.toISOString()).toBe("2026-03-01T06:00:00.000Z");
    expect(scope.toExclusive?.toISOString()).toBe("2026-05-01T06:00:00.000Z");
    expect(issues).toEqual([]);
  });

  it("drops an impossible date and reports it", () => {
    const parsed = parseReportFilters({ from: "2026-13-01" }, KNOWN);

    expect(parsed.filters.from).toBeNull();
    expect(parsed.scope.from).toBeNull();
    expect(parsed.issues).toEqual(["INVALID_DATE"]);
    expect(parseReportFilters({ to: "2026-02-30" }, KNOWN).issues).toEqual(["INVALID_DATE"]);
  });

  it("drops an unknown course and an unknown country", () => {
    const parsed = parseReportFilters({ course: "zzz", country: "Narnia" }, KNOWN);

    expect(parsed.filters).toEqual({ courseId: null, country: null, from: null, to: null });
    expect(parsed.issues).toEqual(["UNKNOWN_COURSE", "UNKNOWN_COUNTRY"]);
  });

  it("keeps a known course and country", () => {
    const parsed = parseReportFilters({ course: "c1", country: "Guatemala" }, KNOWN);

    expect(parsed.scope).toEqual({ courseId: "c1", country: "Guatemala", from: null, toExclusive: null });
    expect(parsed.issues).toEqual([]);
  });

  it("swaps a range given backwards", () => {
    const { filters } = parseReportFilters({ from: "2026-04-30", to: "2026-03-01" }, KNOWN);

    expect(filters).toEqual({ courseId: null, country: null, from: "2026-03-01", to: "2026-04-30" });
  });

  it("takes the first value of a repeated parameter", () => {
    expect(parseReportFilters({ course: ["c1", "zzz"] }, KNOWN).filters.courseId).toBe("c1");
  });

  it("round-trips through search params in a stable key order", () => {
    const input = { to: "2026-04-30", country: "Guatemala", from: "2026-03-01", course: "c1" };
    const { filters } = parseReportFilters(input, KNOWN);
    const params = toSearchParams(filters);

    expect(params.toString()).toBe("course=c1&country=Guatemala&from=2026-03-01&to=2026-04-30");
    expect(parseReportFilters(Object.fromEntries(params), KNOWN).filters).toEqual(filters);
    expect(toSearchParams({ courseId: null, country: null, from: null, to: null }).toString()).toBe("");
  });
});

describe("guatemalaToday", () => {
  it("names the calendar day in Guatemala, not UTC", () => {
    expect(guatemalaToday(new Date("2026-11-18T05:59:00Z"))).toBe("2026-11-17");
    expect(guatemalaToday(new Date("2026-11-18T06:00:00Z"))).toBe("2026-11-18");
  });
});
