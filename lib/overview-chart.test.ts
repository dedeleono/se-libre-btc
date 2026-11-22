import { describe, it, expect } from "vitest";
import { overviewWindow } from "./overview-buckets";
import { isAllZero, niceTicks, overviewMonthLabel, revenueTick, toOverviewRows } from "./overview-chart";

const NOVEMBER = "2026-11-01T06:00:00.000Z";

describe("overviewMonthLabel", () => {
  it("names the month in the admin's language", () => {
    expect(overviewMonthLabel(NOVEMBER, "es", "short")).toBe("nov");
    expect(overviewMonthLabel(NOVEMBER, "en", "short")).toBe("Nov");
  });

  it("spells out the month and year in the long style", () => {
    expect(overviewMonthLabel(NOVEMBER, "es", "long")).toBe("noviembre de 2026");
    expect(overviewMonthLabel(NOVEMBER, "en", "long")).toBe("November 2026");
  });

  it("reads the month in Guatemala time, not UTC or the host zone", () => {
    expect(overviewMonthLabel("2026-01-01T05:30:00.000Z", "es", "short")).toBe("dic");
    expect(overviewMonthLabel("2026-01-01T06:00:00.000Z", "es", "short")).toBe("ene");
  });
});

describe("revenueTick", () => {
  it("prints compact quetzales with at most one decimal", () => {
    expect(revenueTick(0)).toBe("Q 0");
    expect(revenueTick(950)).toBe("Q 950");
    expect(revenueTick(1500)).toBe("Q 1.5K");
    expect(revenueTick(12000)).toBe("Q 12K");
  });
});

describe("niceTicks", () => {
  it("steps by 1, 2 or 5 times a power of ten and covers the maximum", () => {
    expect(niceTicks(12500.75)).toEqual([0, 5000, 10000, 15000]);
    expect(niceTicks(1234.56)).toEqual([0, 500, 1000, 1500]);
    expect(niceTicks(52)).toEqual([0, 20, 40, 60]);
  });

  it("keeps whole-number steps for counts", () => {
    expect(niceTicks(3, { integer: true })).toEqual([0, 1, 2, 3]);
    expect(niceTicks(1, { integer: true })).toEqual([0, 1]);
  });

  it("ends exactly on a round maximum", () => {
    expect(niceTicks(20000)).toEqual([0, 5000, 10000, 15000, 20000]);
  });
});

describe("toOverviewRows", () => {
  const { monthStarts } = overviewWindow(new Date("2026-11-17T12:00:00Z"));
  const zeros = new Array<number>(12).fill(0);

  it("returns one row per month with its ISO start and revenue in quetzales", () => {
    const revenueCents = [...zeros.slice(0, 11), 123456];
    const students = zeros.map((_, i) => i);
    const courses = zeros.map((_, i) => i % 2);
    const rows = toOverviewRows({ monthStarts, revenueCents, students, courses });

    expect(rows).toHaveLength(12);
    expect(rows[0]).toEqual({ monthStart: "2025-12-01T06:00:00.000Z", revenue: 0, students: 0, courses: 0 });
    expect(rows[11]).toEqual({ monthStart: NOVEMBER, revenue: 1234.56, students: 11, courses: 1 });
  });
});

describe("isAllZero", () => {
  const { monthStarts } = overviewWindow(new Date("2026-11-17T12:00:00Z"));
  const zeros = new Array<number>(12).fill(0);
  const rows = (overrides: { revenueCents?: number[]; students?: number[]; courses?: number[] } = {}) =>
    toOverviewRows({
      monthStarts,
      revenueCents: overrides.revenueCents ?? zeros,
      students: overrides.students ?? zeros,
      courses: overrides.courses ?? zeros,
    });

  it("is true when every month is zero for the given metrics", () => {
    expect(isAllZero(rows(), ["revenue"])).toBe(true);
    expect(isAllZero(rows(), ["students", "courses"])).toBe(true);
  });

  it("is false as soon as one month has a value", () => {
    const oneCent = zeros.map((_, i) => (i === 4 ? 1 : 0));
    expect(isAllZero(rows({ revenueCents: oneCent }), ["revenue"])).toBe(false);

    const oneCourse = zeros.map((_, i) => (i === 7 ? 1 : 0));
    expect(isAllZero(rows({ courses: oneCourse }), ["students", "courses"])).toBe(false);
  });

  it("ignores metrics it was not asked about", () => {
    const students = zeros.map(() => 3);
    expect(isAllZero(rows({ students }), ["revenue"])).toBe(true);
  });
});
