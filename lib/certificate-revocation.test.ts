import { describe, it, expect } from "vitest";
import { evaluateEligibility } from "./certificate-eligibility";
import { selectCertificatesToRevoke, type CertificateCheck } from "./certificate-revocation";

const finalQuiz = { id: "q1", chapterId: "c1", title: "Final exam" };

const check = (id: string, eligibility: CertificateCheck["eligibility"], revokedAt: Date | null = null) => ({
  id,
  revokedAt,
  eligibility,
});

const perfect = evaluateEligibility("course", finalQuiz, 100, true);
const noQuizzes = evaluateEligibility("course", null, null, false);
const tooLow = evaluateEligibility("course", finalQuiz, 80, true);
const neverTaken = evaluateEligibility("course", finalQuiz, null, true);
const unresolved = evaluateEligibility("course", null, null, true);

describe("selectCertificatesToRevoke", () => {
  it("returns an empty plan for no certificates", () => {
    expect(selectCertificatesToRevoke([])).toEqual({
      checked: 0,
      eligible: 0,
      alreadyRevoked: 0,
      byReason: {},
      toRevoke: [],
    });
  });

  it("keeps certificates that are still eligible", () => {
    const plan = selectCertificatesToRevoke([check("a", perfect), check("b", noQuizzes)]);
    expect(plan.toRevoke).toEqual([]);
    expect(plan.eligible).toBe(2);
    expect(plan.byReason).toEqual({ ELIGIBLE: 1, NO_QUIZZES: 1 });
  });

  it("revokes every ineligible reason", () => {
    const plan = selectCertificatesToRevoke([
      check("low", tooLow),
      check("never", neverTaken),
      check("unresolved", unresolved),
      check("ok", perfect),
    ]);
    expect(plan.toRevoke).toEqual(["low", "never", "unresolved"]);
    expect(plan.checked).toBe(4);
    expect(plan.eligible).toBe(1);
    expect(plan.byReason).toEqual({ FINAL_QUIZ_SCORE_TOO_LOW: 2, FINAL_QUIZ_UNRESOLVED: 1, ELIGIBLE: 1 });
  });

  it("skips certificates that are already revoked", () => {
    const plan = selectCertificatesToRevoke([check("gone", tooLow, new Date("2026-11-17T00:00:00Z"))]);
    expect(plan.toRevoke).toEqual([]);
    expect(plan.checked).toBe(0);
    expect(plan.alreadyRevoked).toBe(1);
  });
});
