import { describe, expect, it } from "vitest";

import { buildCourseReport, type ReportScope } from "./course-report";
import { FIXTURE_NOW, FIXTURE_ROWS } from "./course-report.fixture";
import { percent, suppressCell, suppressPartition, toPublicReport, type Cell, type PublicCourseReport } from "./publish";
import type { ReportFilters } from "./report-filters";

const v = (value: number): Cell => ({ kind: "value", value });
const S: Cell = { kind: "suppressed" };

const NO_FILTERS: ReportFilters = { courseId: null, country: null, from: null, to: null };

const scope = (overrides: Partial<ReportScope> = {}): ReportScope => ({
  courseId: null,
  country: null,
  from: null,
  toExclusive: null,
  ...overrides,
});

const SCOPES = [
  scope({ courseId: "c1" }),
  scope({ courseId: "c2" }),
  scope({ courseId: "c3" }),
  scope(),
  scope({ courseId: "c1", from: new Date("2026-03-01T06:00:00Z"), toExclusive: new Date("2026-05-01T06:00:00Z") }),
  scope({ courseId: "c1", country: "Guatemala" }),
];

const publish = (s: ReportScope, k: number) => toPublicReport(buildCourseReport(FIXTURE_ROWS, s, FIXTURE_NOW), NO_FILTERS, k);

function leakedCells(node: unknown, k: number, path = "report"): string[] {
  if (Array.isArray(node)) return node.flatMap((child, i) => leakedCells(child, k, `${path}[${i}]`));
  if (node === null || typeof node !== "object") return [];
  const record = node as Record<string, unknown>;
  if (record.kind === "value" && typeof record.value === "number" && record.value >= 1 && record.value < k) {
    return [`${path} = ${record.value}`];
  }
  return Object.entries(record).flatMap(([key, child]) => leakedCells(child, k, `${path}.${key}`));
}

const column = (rows: PublicCourseReport["byAge"], field: "students" | "completed" | "certified") =>
  rows.map((row) => row[field]);

describe("suppressCell", () => {
  it("hides 1..k-1 and shows zero and k or more", () => {
    expect(suppressCell(0, 5)).toEqual(v(0));
    expect(suppressCell(4, 5)).toEqual(S);
    expect(suppressCell(5, 5)).toEqual(v(5));
  });
});

describe("suppressPartition", () => {
  it("adds a complementary suppression on the smallest non-zero visible cell", () => {
    expect(suppressPartition([5, 1, 7, 0], 5)).toEqual([S, S, v(7), v(0)]);
  });

  it("breaks ties toward the later cell so top rows stay visible", () => {
    expect(suppressPartition([2, 2, 1], 2)).toEqual([v(2), S, S]);
  });

  it("leaves a partition alone when two or more cells are already hidden", () => {
    expect(suppressPartition([1, 1, 9], 5)).toEqual([S, S, v(9)]);
  });
});

describe("percent", () => {
  it("needs both cells visible and a positive denominator", () => {
    expect(percent(v(2), v(3))).toBe(67);
    expect(percent(S, v(3))).toBeNull();
    expect(percent(v(0), v(0))).toBeNull();
  });
});

describe("toPublicReport", () => {
  it("T1 at k=5 hides every small count and percentages built on them", () => {
    const report = publish(SCOPES[0], 5);

    expect(report.funnel.map((step) => step.count)).toEqual([v(5), S, S, S, S]);
    expect(report.funnel.map((step) => step.conversionFromPrevious)).toEqual([null, null, null, null, null]);
    expect(report.tiles.certificatesIssued).toEqual(S);
    expect(report.tiles.peopleCompleted).toEqual(S);
    expect(report.tiles.completionRate).toBeNull();
    expect(report.tiles.coverage).toBeNull();
    expect(report.threshold).toBe(5);
    expect(report.courseTitle).toBe("Bitcoin 101");
    expect(leakedCells(report, 5)).toEqual([]);
  });

  it("T1 at k=2 applies primary, complementary and folding rules", () => {
    const report = publish(SCOPES[0], 2);

    expect(report.funnel.map((step) => step.count)).toEqual([v(5), v(4), v(3), v(2), S]);
    expect(report.funnel.map((step) => step.conversionFromPrevious)).toEqual([null, 80, 75, 67, null]);

    expect(column(report.byAge, "students")).toEqual([S, S, v(2), v(0), v(0), v(0), v(0), S]);
    expect(column(report.byAge, "completed")).toEqual([v(0), S, S, v(0), v(0), v(0), v(0), v(0)]);
    expect(column(report.byAge, "certified")).toEqual([v(0), S, v(0), v(0), v(0), v(0), v(0), v(0)]);

    expect(report.byCountry.map((row) => row.key)).toEqual(["Guatemala", "OTHER", "UNKNOWN"]);
    expect(report.byCountry.map((row) => row.students)).toEqual([v(2), S, S]);
    expect(report.byCountry.map((row) => row.completed)).toEqual([S, S, v(0)]);
    expect(report.byCountry.map((row) => row.certified)).toEqual([S, v(0), v(0)]);
  });

  it("keeps the top 10 places and folds the rest into OTHER", () => {
    const base = buildCourseReport(FIXTURE_ROWS, SCOPES[3], FIXTURE_NOW);
    const places = Array.from({ length: 12 }, (_, i) => ({
      key: `País ${String(i + 1).padStart(2, "0")}`,
      students: 30 - i,
      completed: 0,
      certified: 0,
    }));
    const report = toPublicReport(
      { ...base, byCountry: [...places, { key: "UNKNOWN", students: 6, completed: 0, certified: 0 }] },
      NO_FILTERS,
      5,
    );

    expect(report.byCountry.map((row) => row.key)).toEqual([...places.slice(0, 10).map((place) => place.key), "OTHER", "UNKNOWN"]);
    expect(report.byCountry[10].students).toEqual(v(20 + 19));
  });

  it("suppresses the monthly certificate series as a partition", () => {
    const report = publish(SCOPES[3], 2);
    const february = report.certificatesByMonth.find((month) => month.month === "2026-02");

    expect(report.certificatesByMonth).toHaveLength(12);
    expect(february?.count).toEqual(v(2));
    expect(leakedCells(publish(SCOPES[3], 5), 5)).toEqual([]);
  });

  it("never publishes a count between 1 and k-1 for any scope", () => {
    for (const s of SCOPES) expect(leakedCells(publish(s, 5), 5)).toEqual([]);
  });
});
