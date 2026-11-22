import type { FunnelStep } from "./course-report";
import { OTHER, UNKNOWN } from "./keys";
import type { Cell, Percent, PublicBreakdownRow, PublicCourseReport } from "./publish";
import type { ReportFilters } from "./report-filters";

export type CsvTileKey = "certificatesIssued" | "peopleCompleted" | "completionRate" | "coverage";

export type CsvLabels = {
  header: readonly [string, string, string, string, string, string, string];
  tiles: Record<CsvTileKey, string>;
  steps: Record<FunnelStep, string>;
  unknown: string;
  other: string;
  month: (key: string) => string;
};

type Field = string | Cell | Percent | undefined;

const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]/;
const BOM = "﻿";

function escapeField(raw: string): string {
  const guarded = FORMULA_START.test(raw) ? `'${raw}` : raw;
  return NEEDS_QUOTES.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

function renderField(field: Field, threshold: number): string {
  if (field === null || field === undefined) return "";
  if (typeof field === "number") return String(field);
  if (typeof field === "string") return field;
  return field.kind === "suppressed" ? `<${threshold}` : String(field.value);
}

const SCOPE_KEYS: [string, keyof ReportFilters][] = [
  ["course", "courseId"],
  ["country", "country"],
  ["from", "from"],
  ["to", "to"],
];

export function toCsv(report: PublicCourseReport, labels: CsvLabels): string {
  const rows: Field[][] = [[...labels.header]];
  const push = (section: string, key: string, label: string, ...values: Field[]) => {
    const padded = [...values, undefined, undefined, undefined, undefined].slice(0, 4);
    rows.push([section, key, label, ...padded]);
  };
  const placeLabel = (key: string) => (key === UNKNOWN ? labels.unknown : key === OTHER ? labels.other : key);
  const breakdown = (section: string, items: readonly PublicBreakdownRow<string>[]) => {
    for (const row of items) {
      push(section, row.key, placeLabel(row.key), row.students, row.completed, row.certified, row.completionRate);
    }
  };

  for (const [key, filter] of SCOPE_KEYS) {
    const value = report.filters[filter];
    if (value === null) continue;
    push("scope", key, key === "course" ? (report.courseTitle ?? value) : value);
  }

  const { tiles } = report;
  push("tiles", "certificatesIssued", labels.tiles.certificatesIssued, tiles.certificatesIssued);
  push("tiles", "peopleCompleted", labels.tiles.peopleCompleted, tiles.peopleCompleted);
  push("tiles", "completionRate", labels.tiles.completionRate, undefined, undefined, undefined, tiles.completionRate);
  push("tiles", "coverage", labels.tiles.coverage, tiles.withDemographics, undefined, undefined, tiles.coverage);

  for (const step of report.funnel) {
    push("funnel", step.step, labels.steps[step.step], step.count, undefined, undefined, step.conversionFromPrevious);
  }

  breakdown("age", report.byAge);
  breakdown("country", report.byCountry);
  if (report.byRegion) breakdown("region", report.byRegion);

  for (const row of report.byCourse) {
    push("course", row.key, row.title, row.students, row.completed, row.certified, row.completionRate);
  }

  for (const month of report.certificatesByMonth) {
    push("month", month.month, labels.month(month.month), month.count);
  }

  const body = rows
    .map((row) => row.map((field) => escapeField(renderField(field, report.threshold))).join(","))
    .join("\r\n");
  return `${BOM}${body}\r\n`;
}
