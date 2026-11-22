import { describe, expect, it } from "vitest";

import { resolveChapterAccess } from "./chapter-access-rule";

type Input = Parameters<typeof resolveChapterAccess>[0];

const signedOut = { isAuthenticated: false, role: null, hasEnrollment: false } as const;
const student = { isAuthenticated: true, role: "STUDENT" } as const;

// Legacy behavior, read from the three copies of the rule that existed before
// resolveChapterAccess (course layout sidebar loop, and the chapter page gate).
// [label, input, legacyLayoutOpen, legacyPageOpen]
const rows: ReadonlyArray<readonly [string, Input, boolean, boolean]> = [
  ["1 signed out, intro", { ...signedOut, isIntro: true }, true, true],
  ["2 signed out, not intro", { ...signedOut, isIntro: false }, false, false],
  ["3 student, intro, not enrolled", { ...student, isIntro: true, hasEnrollment: false }, true, true],
  [
    "4 admin, not intro, not enrolled",
    { isAuthenticated: true, role: "ADMIN", isIntro: false, hasEnrollment: false },
    true,
    true,
  ],
  ["5 student, enrolled", { ...student, isIntro: false, hasEnrollment: true }, true, true],
  ["6 student, enrolled, completed", { ...student, isIntro: false, hasEnrollment: true }, true, true],
  ["7 student, not enrolled", { ...student, isIntro: false, hasEnrollment: false }, false, false],
  ["8 student, not enrolled, completed", { ...student, isIntro: false, hasEnrollment: false }, true, false],
];

describe("resolveChapterAccess", () => {
  it.each(rows)("row %s follows the chapter page gate", (_label, input, _layout, page) => {
    expect(resolveChapterAccess(input).accessible).toBe(page);
  });

  it("row 8: a completed chapter without enrollment is locked (was open in the sidebar only)", () => {
    expect(resolveChapterAccess({ ...student, isIntro: false, hasEnrollment: false })).toEqual({
      accessible: false,
      reason: "ENROLLMENT_REQUIRED",
    });
  });

  it("asks signed-out visitors to sign in for non-intro chapters", () => {
    expect(resolveChapterAccess({ ...signedOut, isIntro: false })).toEqual({
      accessible: false,
      reason: "SIGN_IN_REQUIRED",
    });
  });

  it("asks signed-in students without enrollment to enroll", () => {
    expect(resolveChapterAccess({ ...student, isIntro: false, hasEnrollment: false })).toEqual({
      accessible: false,
      reason: "ENROLLMENT_REQUIRED",
    });
  });

  it.each(rows.filter(([, , , page]) => page))("row %s opens with no reason", (_label, input) => {
    expect(resolveChapterAccess(input)).toEqual({ accessible: true });
  });

  it("does not let a signed-out caller claiming a role or enrollment past the gate", () => {
    expect(
      resolveChapterAccess({ isAuthenticated: false, role: "ADMIN", isIntro: false, hasEnrollment: true }),
    ).toEqual({ accessible: false, reason: "SIGN_IN_REQUIRED" });
  });
});
