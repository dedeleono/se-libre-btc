import { describe, expect, it } from "vitest";

import { buildCourseReport, type ReportRows, type ReportScope } from "./course-report";
import { FIXTURE_NOW, FIXTURE_ROWS } from "./course-report.fixture";

const scope = (overrides: Partial<ReportScope> = {}): ReportScope => ({
  courseId: null,
  country: null,
  from: null,
  toExclusive: null,
  ...overrides,
});

const funnelCounts = (rows: ReportRows, s: ReportScope) =>
  buildCourseReport(rows, s, FIXTURE_NOW).funnel.map((step) => step.count);

const row = <K extends string>(key: K, students: number, completed: number, certified: number) => ({
  key,
  students,
  completed,
  certified,
});

const zeroAges = ["35-44", "45-54", "55-64", "65+"].map((key) => row(key, 0, 0, 0));

const T1 = scope({ courseId: "c1" });
const T2 = scope({ courseId: "c2" });
const T3 = scope({ courseId: "c3" });
const T4 = scope();
const T5 = scope({
  courseId: "c1",
  from: new Date("2026-03-01T06:00:00Z"),
  toExclusive: new Date("2026-05-01T06:00:00Z"),
});
const T6 = scope({ courseId: "c1", country: "Guatemala" });

describe("buildCourseReport", () => {
  it("T1: counts a single course as people, excluding admins and including path access", () => {
    const report = buildCourseReport(FIXTURE_ROWS, T1, FIXTURE_NOW);

    expect(report.funnel).toEqual([
      { step: "ENROLLED", count: 5 },
      { step: "STARTED", count: 4 },
      { step: "COMPLETED", count: 3 },
      { step: "FINAL_PASSED", count: 2 },
      { step: "CERTIFIED", count: 1 },
    ]);
    expect(report.unit).toBe("PEOPLE");
    expect(report.finalExam).toBe("RESOLVED");
    expect(report.courseTitle).toBe("Bitcoin 101");
    expect(report.totals).toEqual({
      students: 5,
      onboarded: 5,
      withDemographics: 4,
      certificatesIssued: 1,
      peopleCompleted: 3,
    });
    expect(report.byAge).toEqual([
      row("13-17", 1, 0, 0),
      row("18-24", 1, 1, 1),
      row("25-34", 2, 2, 0),
      ...zeroAges,
      row("UNKNOWN", 1, 0, 0),
    ]);
    expect(report.byCountry).toEqual([
      row("Guatemala", 2, 2, 1),
      row("El Salvador", 1, 0, 0),
      row("Mexico", 1, 1, 0),
      row("UNKNOWN", 1, 0, 0),
    ]);
    expect(report.byRegion).toBeNull();
    expect(report.byCourse).toEqual([]);
  });

  it("T2: a course without quizzes passes the final-exam step on completion", () => {
    expect(funnelCounts(FIXTURE_ROWS, T2)).toEqual([2, 1, 1, 1, 1]);
    expect(buildCourseReport(FIXTURE_ROWS, T2, FIXTURE_NOW).finalExam).toBe("NO_QUIZZES");
  });

  it("T3: an unpublished final exam fails closed", () => {
    expect(funnelCounts(FIXTURE_ROWS, T3)).toEqual([1, 1, 1, 0, 0]);
    expect(buildCourseReport(FIXTURE_ROWS, T3, FIXTURE_NOW).finalExam).toBe("UNRESOLVED");
  });

  it("T4: all courses count enrollments in the funnel and distinct people in breakdowns", () => {
    const report = buildCourseReport(FIXTURE_ROWS, T4, FIXTURE_NOW);

    expect(report.unit).toBe("ENROLLMENTS");
    expect(report.finalExam).toBeNull();
    expect(report.courseTitle).toBeNull();
    expect(report.funnel.map((step) => step.count)).toEqual([8, 6, 5, 3, 2]);
    expect(report.totals).toEqual({
      students: 6,
      onboarded: 6,
      withDemographics: 4,
      certificatesIssued: 2,
      peopleCompleted: 4,
    });
    expect(report.byAge).toEqual([
      row("13-17", 1, 0, 0),
      row("18-24", 1, 1, 1),
      row("25-34", 2, 2, 0),
      ...zeroAges,
      row("UNKNOWN", 2, 1, 1),
    ]);
    expect(report.byCourse).toEqual([
      { ...row("c1", 5, 3, 1), title: "Bitcoin 101", finalExam: "RESOLVED" },
      { ...row("c2", 2, 1, 1), title: "Sin quizzes", finalExam: "NO_QUIZZES" },
      { ...row("c3", 1, 1, 0), title: "Examen oculto", finalExam: "UNRESOLVED" },
    ]);
  });

  it("T5: the date range selects an enrollment cohort and counts its progress up to today", () => {
    expect(funnelCounts(FIXTURE_ROWS, T5)).toEqual([3, 2, 1, 1, 0]);
  });

  it("T6: the country filter narrows people and adds regions", () => {
    const report = buildCourseReport(FIXTURE_ROWS, T6, FIXTURE_NOW);

    expect(report.funnel.map((step) => step.count)).toEqual([2, 2, 2, 1, 1]);
    expect(report.byRegion).toEqual([row("Guatemala", 1, 1, 1), row("Quetzaltenango", 1, 1, 0)]);
    expect(report.byCountry).toEqual([row("Guatemala", 2, 2, 1), row("UNKNOWN", 0, 0, 0)]);
  });

  it("T7: every funnel step is at most the previous one", () => {
    for (const s of [T1, T2, T3, T4, T5, T6]) {
      const counts = funnelCounts(FIXTURE_ROWS, s);
      counts.slice(1).forEach((count, i) => expect(count).toBeLessThanOrEqual(counts[i]));
    }
  });

  it("T8: a revoked certificate counts as no certificate", () => {
    const rows: ReportRows = {
      ...FIXTURE_ROWS,
      certificates: [
        { userId: "u1", courseId: "c1", issuedAt: new Date("2026-02-02T15:00:00Z"), revokedAt: new Date("2026-11-18T15:00:00Z") },
        { userId: "u4", courseId: "c2", issuedAt: new Date("2026-02-06T15:00:00Z"), revokedAt: new Date("2026-11-18T15:00:00Z") },
      ],
    };
    const report = buildCourseReport(rows, T4, FIXTURE_NOW);

    expect(report.funnel.map((step) => step.count)).toEqual([8, 6, 5, 3, 0]);
    expect(report.totals.certificatesIssued).toBe(0);
    expect(report.certificatesByMonth.every((month) => month.count === 0)).toBe(true);
  });

  it("T9: certificates per month cover the last 12 Guatemala months and follow the filters", () => {
    const all = buildCourseReport(FIXTURE_ROWS, T4, FIXTURE_NOW).certificatesByMonth;
    expect(all.map((month) => month.month)).toEqual([
      "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05",
      "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11",
    ]);
    expect(all.find((month) => month.month === "2026-02")?.count).toBe(2);
    expect(all.reduce((sum, month) => sum + month.count, 0)).toBe(2);

    const c1 = buildCourseReport(FIXTURE_ROWS, T1, FIXTURE_NOW).certificatesByMonth;
    expect(c1.find((month) => month.month === "2026-02")?.count).toBe(1);

    const cohort = buildCourseReport(FIXTURE_ROWS, T5, FIXTURE_NOW).certificatesByMonth;
    expect(cohort.reduce((sum, month) => sum + month.count, 0)).toBe(0);
  });

  it("T10: certificates issued before the 12-month window still count in the total", () => {
    const rows: ReportRows = {
      ...FIXTURE_ROWS,
      certificates: [{ userId: "u1", courseId: "c1", issuedAt: new Date("2025-11-30T15:00:00Z"), revokedAt: null }],
    };
    const report = buildCourseReport(rows, T1, FIXTURE_NOW);

    expect(report.totals.certificatesIssued).toBe(1);
    expect(report.certificatesByMonth.reduce((sum, month) => sum + month.count, 0)).toBe(0);
  });
});

describe("certificate months in Guatemala time", () => {
  const issuedAt = (iso: string): ReportRows => ({
    ...FIXTURE_ROWS,
    certificates: [{ userId: "u1", courseId: "c1", issuedAt: new Date(iso), revokedAt: null }],
  });
  const monthOf = (rows: ReportRows, now = FIXTURE_NOW) =>
    buildCourseReport(rows, T1, now).certificatesByMonth.find((month) => month.count === 1)?.month;

  it("counts an instant in the month it has in Guatemala (UTC-6)", () => {
    expect(monthOf(issuedAt("2026-03-01T05:59:59Z"))).toBe("2026-02");
    expect(monthOf(issuedAt("2026-03-01T06:00:00Z"))).toBe("2026-03");
  });

  it("ends the window at the current Guatemala month", () => {
    const months = buildCourseReport(FIXTURE_ROWS, T1, new Date("2026-12-01T05:00:00Z")).certificatesByMonth;
    expect(months[0].month).toBe("2025-12");
    expect(months[11].month).toBe("2026-11");
  });
});
