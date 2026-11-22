import type { AgeBucket } from "../demographics";
import type { BreakdownRow, CourseReport, FinalExamStatus, FunnelStep } from "./course-report";
import { OTHER, UNKNOWN } from "./keys";
import type { ReportFilters } from "./report-filters";

/**
 * Smallest group size shown as a number. Counts from 1 to 4 render as "<5".
 *
 * NCES SLDS Technical Brief 3 (NCES 2011-603) reports state minimum group sizes
 * from 5 to 30, modal 10, and recommends 10 with complementary suppression for
 * public release. This dashboard and its CSV are admin-only on a small platform,
 * so 5 (the low end of practice) keeps it useful. Raising it is this one line.
 */
export const SMALL_CELL_THRESHOLD = 5;

export const TOP_PLACES = 10;

export type Cell = { kind: "value"; value: number } | { kind: "suppressed" };
export type Percent = number | null;
export type PublicBreakdownRow<K extends string> = {
  key: K;
  students: Cell;
  completed: Cell;
  certified: Cell;
  completionRate: Percent;
};
export type PublicCourseRow = PublicBreakdownRow<string> & { title: string; finalExam: FinalExamStatus };
export type PublicFunnelStep = { step: FunnelStep; count: Cell; conversionFromPrevious: Percent };
export type PublicMonth = { month: string; count: Cell };

export type PublicCourseReport = {
  threshold: number;
  filters: ReportFilters;
  courseTitle: string | null;
  unit: CourseReport["unit"];
  finalExam: FinalExamStatus | null;
  tiles: {
    certificatesIssued: Cell;
    peopleCompleted: Cell;
    completionRate: Percent;
    coverage: Percent;
    withDemographics: Cell;
    students: Cell;
  };
  funnel: PublicFunnelStep[];
  byAge: PublicBreakdownRow<AgeBucket>[];
  byCountry: PublicBreakdownRow<string>[];
  byRegion: PublicBreakdownRow<string>[] | null;
  byCourse: PublicCourseRow[];
  certificatesByMonth: PublicMonth[];
};

const SUPPRESSED: Cell = { kind: "suppressed" };

export function suppressCell(n: number, k: number): Cell {
  return n >= 1 && n < k ? SUPPRESSED : { kind: "value", value: n };
}

export function suppressPartition(values: readonly number[], k: number): Cell[] {
  const cells = values.map((value) => suppressCell(value, k));
  if (cells.filter((cell) => cell.kind === "suppressed").length !== 1) return cells;

  let target = -1;
  cells.forEach((cell, i) => {
    if (cell.kind !== "value" || cell.value === 0) return;
    if (target === -1 || values[i] <= values[target]) target = i;
  });
  if (target !== -1) cells[target] = SUPPRESSED;
  return cells;
}

export function percent(num: Cell, den: Cell): Percent {
  if (num.kind !== "value" || den.kind !== "value" || den.value <= 0) return null;
  return Math.round((100 * num.value) / den.value);
}

const COLUMNS = ["students", "completed", "certified"] as const;

function publishPartition<K extends string>(rows: readonly BreakdownRow<K>[], k: number): PublicBreakdownRow<K>[] {
  const [students, completed, certified] = COLUMNS.map((column) =>
    suppressPartition(
      rows.map((row) => row[column]),
      k,
    ),
  );
  return rows.map((row, i) => ({
    key: row.key,
    students: students[i],
    completed: completed[i],
    certified: certified[i],
    completionRate: percent(completed[i], students[i]),
  }));
}

function sumRows(key: string, rows: readonly BreakdownRow<string>[]): BreakdownRow<string> {
  return rows.reduce(
    (total, row) => ({
      key,
      students: total.students + row.students,
      completed: total.completed + row.completed,
      certified: total.certified + row.certified,
    }),
    { key, students: 0, completed: 0, certified: 0 },
  );
}

function foldPlaces(rows: readonly BreakdownRow<string>[], k: number): BreakdownRow<string>[] {
  const known = rows.filter((row) => row.key !== UNKNOWN);
  const large = known.filter((row) => row.students >= k);
  const kept = large.slice(0, TOP_PLACES);
  const other = sumRows(OTHER, [...known.filter((row) => row.students < k), ...large.slice(TOP_PLACES)]);
  const unknown = rows.find((row) => row.key === UNKNOWN) ?? sumRows(UNKNOWN, []);
  return [...kept, ...(other.students > 0 ? [other] : []), unknown];
}

export function toPublicReport(
  report: CourseReport,
  filters: ReportFilters,
  k: number = SMALL_CELL_THRESHOLD,
): PublicCourseReport {
  const funnelCells = report.funnel.map((step) => suppressCell(step.count, k));
  const funnelCell = (step: FunnelStep) => funnelCells[report.funnel.findIndex((row) => row.step === step)];
  const students = suppressCell(report.totals.students, k);
  const withDemographics = suppressCell(report.totals.withDemographics, k);
  const monthCells = suppressPartition(
    report.certificatesByMonth.map((month) => month.count),
    k,
  );

  return {
    threshold: k,
    filters,
    courseTitle: report.courseTitle,
    unit: report.unit,
    finalExam: report.finalExam,
    tiles: {
      certificatesIssued: suppressCell(report.totals.certificatesIssued, k),
      peopleCompleted: suppressCell(report.totals.peopleCompleted, k),
      completionRate: percent(funnelCell("COMPLETED"), funnelCell("ENROLLED")),
      coverage: percent(withDemographics, students),
      withDemographics,
      students,
    },
    funnel: report.funnel.map((step, i) => ({
      step: step.step,
      count: funnelCells[i],
      conversionFromPrevious: i === 0 ? null : percent(funnelCells[i], funnelCells[i - 1]),
    })),
    byAge: publishPartition(report.byAge, k),
    byCountry: publishPartition(foldPlaces(report.byCountry, k), k),
    byRegion: report.byRegion ? publishPartition(foldPlaces(report.byRegion, k), k) : null,
    byCourse: report.byCourse.map((row) => {
      const rowStudents = suppressCell(row.students, k);
      const completed = suppressCell(row.completed, k);
      return {
        key: row.key,
        title: row.title,
        finalExam: row.finalExam,
        students: rowStudents,
        completed,
        certified: suppressCell(row.certified, k),
        completionRate: percent(completed, rowStudents),
      };
    }),
    certificatesByMonth: report.certificatesByMonth.map((month, i) => ({ month: month.month, count: monthCells[i] })),
  };
}
