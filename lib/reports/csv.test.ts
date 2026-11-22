import { describe, expect, it } from "vitest";

import { buildCourseReport } from "./course-report";
import { FIXTURE_NOW, FIXTURE_ROWS } from "./course-report.fixture";
import { toCsv, type CsvLabels } from "./csv";
import { toPublicReport } from "./publish";

const LABELS: CsvLabels = {
  header: ["seccion", "clave", "etiqueta", "estudiantes", "completaron", "certificados", "porcentaje"],
  tiles: {
    certificatesIssued: "Certificados emitidos",
    peopleCompleted: "Personas que completaron",
    completionRate: "Tasa de finalización",
    coverage: "Cobertura demográfica",
  },
  steps: {
    ENROLLED: "Inscritos",
    STARTED: "Comenzaron",
    COMPLETED: "Completaron",
    FINAL_PASSED: "Aprobaron el examen final con 100",
    CERTIFIED: "Recibieron certificado",
  },
  unknown: "Sin dato",
  other: "Otros",
  month: (key) => `mes ${key}`,
};

const c1Scope = { courseId: "c1", country: null, from: null, toExclusive: null };
const c1Filters = { courseId: "c1", country: null, from: "2026-01-01", to: null };

const csvFor = (k: number, titles: Record<string, string> = {}) => {
  const rows = {
    ...FIXTURE_ROWS,
    courses: FIXTURE_ROWS.courses.map((course) => ({ ...course, title: titles[course.id] ?? course.title })),
  };
  const scope = Object.keys(titles).length ? { ...c1Scope, courseId: null } : c1Scope;
  const filters = Object.keys(titles).length ? { ...c1Filters, courseId: null } : c1Filters;
  return toCsv(toPublicReport(buildCourseReport(rows, scope, FIXTURE_NOW), filters, k), LABELS);
};

const lines = (csv: string) => csv.replace(/^﻿/, "").split("\r\n");

describe("toCsv", () => {
  it("starts with a BOM and the localized header, and ends lines with CRLF", () => {
    const csv = csvFor(2);

    expect(csv.startsWith("﻿seccion,clave,etiqueta,estudiantes,completaron,certificados,porcentaje\r\n")).toBe(true);
    expect(csv.includes("\n") && !/[^\r]\n/.test(csv)).toBe(true);
  });

  it("writes funnel counts with the conversion from the previous step", () => {
    expect(lines(csvFor(2))).toContain("funnel,STARTED,Comenzaron,4,,,80");
    expect(lines(csvFor(2))).toContain("funnel,ENROLLED,Inscritos,5,,,");
  });

  it("writes a suppressed cell as <k", () => {
    expect(lines(csvFor(2))).toContain("age,13-17,13-17,<2,0,0,");
    expect(lines(csvFor(5))).toContain("funnel,STARTED,Comenzaron,<5,,,");
  });

  it("echoes the active filters as scope rows", () => {
    const rows = lines(csvFor(2));

    expect(rows).toContain("scope,course,Bitcoin 101,,,,");
    expect(rows).toContain("scope,from,2026-01-01,,,,");
    expect(rows.some((line) => line.startsWith("scope,country"))).toBe(false);
  });

  it("neutralizes spreadsheet formulas and quotes per RFC 4180", () => {
    const csv = csvFor(2, { c1: '=HYPERLINK("x")', c2: "Bitcoin, avanzado" });

    expect(csv).toContain(`course,c1,"'=HYPERLINK(""x"")",`);
    expect(csv).toContain(`course,c2,"Bitcoin, avanzado",`);
  });

  it("writes every certificate month", () => {
    const monthRows = lines(csvFor(2)).filter((line) => line.startsWith("month,"));

    expect(monthRows).toHaveLength(12);
    expect(monthRows).toContain("month,2026-02,mes 2026-02,<2,,,");
  });

  it("contains no per-person identifiers", () => {
    const csv = csvFor(2);
    for (const id of ["u1", "u2", "u3", "u4", "u5", "u6", "a1"]) expect(csv).not.toContain(id);
  });
});
