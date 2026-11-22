import { COUNTRIES } from "../constants/countries";
import type { ReportScope } from "./course-report";

export const REPORT_UTC_OFFSET = "-06:00";

export type ReportFilters = { courseId: string | null; country: string | null; from: string | null; to: string | null };
export type FilterIssue = "INVALID_DATE" | "UNKNOWN_COURSE" | "UNKNOWN_COUNTRY";
export type ParsedFilters = { filters: ReportFilters; scope: ReportScope; issues: FilterIssue[] };
export type RawSearchParams = Record<string, string | string[] | undefined>;

export const NO_REPORT_FILTERS: ReportFilters = { courseId: null, country: null, from: null, to: null };

const COUNTRY_NAMES = new Set(COUNTRIES.map((country) => country.name));
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function first(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

function isCalendarDay(value: string): boolean {
  const match = DAY_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const startOfDay = (day: string) => new Date(`${day}T00:00:00${REPORT_UTC_OFFSET}`);

export function parseReportFilters(params: RawSearchParams, knownCourseIds: ReadonlySet<string>): ParsedFilters {
  const issues: FilterIssue[] = [];

  const rawDays = [first(params.from), first(params.to)];
  if (rawDays.some((day) => day !== null && !isCalendarDay(day))) issues.push("INVALID_DATE");
  const [validFrom, validTo] = rawDays.map((day) => (day !== null && isCalendarDay(day) ? day : null));
  const [from, to] = validFrom && validTo && validFrom > validTo ? [validTo, validFrom] : [validFrom, validTo];

  const rawCourse = first(params.course);
  const courseId = rawCourse !== null && knownCourseIds.has(rawCourse) ? rawCourse : null;
  if (rawCourse !== null && courseId === null) issues.push("UNKNOWN_COURSE");

  const rawCountry = first(params.country);
  const country = rawCountry !== null && COUNTRY_NAMES.has(rawCountry) ? rawCountry : null;
  if (rawCountry !== null && country === null) issues.push("UNKNOWN_COUNTRY");

  return {
    filters: { courseId, country, from, to },
    scope: {
      courseId,
      country,
      from: from ? startOfDay(from) : null,
      toExclusive: to ? new Date(startOfDay(to).getTime() + DAY_MS) : null,
    },
    issues,
  };
}

export function toSearchParams(filters: ReportFilters): URLSearchParams {
  const params = new URLSearchParams();
  const entries: [string, string | null][] = [
    ["course", filters.courseId],
    ["country", filters.country],
    ["from", filters.from],
    ["to", filters.to],
  ];
  for (const [key, value] of entries) if (value !== null) params.set(key, value);
  return params;
}

export function guatemalaToday(now: Date = new Date()): string {
  return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function hasActiveFilters(filters: ReportFilters): boolean {
  return Object.values(filters).some((value) => value !== null);
}
