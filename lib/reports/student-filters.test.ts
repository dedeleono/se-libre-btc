import { describe, expect, it } from "vitest";

import { AGE_RANGES } from "../constants/demographics";
import { parseStudentFilters, studentListParams, toStudentWhere, STUDENT_PAGE_SIZE } from "./student-filters";

const NONE = { ageRange: null, country: null, region: null, certificates: null, page: 1 };

describe("parseStudentFilters", () => {
  it("keeps valid values", () => {
    expect(
      parseStudentFilters({ age: "18-24", country: "Guatemala", region: "Quetzaltenango", certificates: "some", page: "3" }),
    ).toEqual({ ageRange: "18-24", country: "Guatemala", region: "Quetzaltenango", certificates: "some", page: 3 });
  });

  it("accepts UNKNOWN for age and country", () => {
    expect(parseStudentFilters({ age: "UNKNOWN", country: "UNKNOWN" })).toEqual({
      ...NONE,
      ageRange: "UNKNOWN",
      country: "UNKNOWN",
    });
  });

  it("drops invalid values instead of failing", () => {
    expect(parseStudentFilters({ age: "17-25", country: "Narnia", certificates: "lots", page: "-2" })).toEqual(NONE);
    expect(parseStudentFilters({ page: "abc" })).toEqual(NONE);
  });

  it("drops a region that does not belong to the chosen country, or has no country", () => {
    expect(parseStudentFilters({ country: "Guatemala", region: "Jalisco" }).region).toBeNull();
    expect(parseStudentFilters({ region: "Quetzaltenango" }).region).toBeNull();
  });
});

describe("toStudentWhere", () => {
  it("always limits the list to active students", () => {
    expect(toStudentWhere(NONE)).toEqual({ role: "STUDENT", isDeleted: false, AND: [] });
  });

  it("matches unknown ages as missing, empty or outside the known ranges", () => {
    expect(toStudentWhere({ ...NONE, ageRange: "UNKNOWN" }).AND).toEqual([
      { OR: [{ ageRange: null }, { ageRange: { notIn: [...AGE_RANGES] } }] },
    ]);
  });

  it("counts only certificates that were not revoked", () => {
    expect(toStudentWhere({ ...NONE, certificates: "some" }).AND).toEqual([
      { certificates: { some: { revokedAt: null } } },
    ]);
    expect(toStudentWhere({ ...NONE, certificates: "none" }).AND).toEqual([
      { certificates: { none: { revokedAt: null } } },
    ]);
  });

  it("combines country and region", () => {
    expect(toStudentWhere({ ...NONE, country: "Guatemala", region: "Quetzaltenango" }).AND).toEqual([
      { country: "Guatemala" },
      { region: "Quetzaltenango" },
    ]);
    expect(toStudentWhere({ ...NONE, country: "UNKNOWN" }).AND).toEqual([{ OR: [{ country: null }, { country: "" }] }]);
  });
});

describe("studentListParams", () => {
  it("omits defaults and keeps a stable order", () => {
    expect(studentListParams(NONE).toString()).toBe("");
    expect(
      studentListParams({ ageRange: "18-24", country: "Guatemala", region: null, certificates: "none", page: 2 }).toString(),
    ).toBe("age=18-24&country=Guatemala&certificates=none&page=2");
  });

  it("uses 50 students per page", () => {
    expect(STUDENT_PAGE_SIZE).toBe(50);
  });
});
