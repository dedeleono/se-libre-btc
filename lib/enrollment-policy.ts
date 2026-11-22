export type EnrollRole = "ADMIN" | "STUDENT";
export type EnrollTarget = { isPublished: boolean; isFree: boolean };
export type EnrollDecision = { ok: true } | { ok: false; status: 402 | 404 | 409 };

export function decideSelfEnroll(target: EnrollTarget | null, role: EnrollRole): EnrollDecision {
  if (role === "ADMIN") return { ok: true };
  if (!target || !target.isPublished) return { ok: false, status: 404 };
  if (!target.isFree) return { ok: false, status: 402 };
  return { ok: true };
}

export type CohortStatus = "DRAFT" | "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type CohortEnrollTarget = {
  status: CohortStatus;
  capacity: number | null;
  takenSeats: number;
  holdsSeat: boolean;
  content: readonly EnrollTarget[];
};

const ENROLLABLE_STATUSES: readonly CohortStatus[] = ["OPEN", "IN_PROGRESS"];

export function decideCohortEnroll(cohort: CohortEnrollTarget | null, role: EnrollRole): EnrollDecision {
  if (role === "ADMIN") return { ok: true };
  if (!cohort || !ENROLLABLE_STATUSES.includes(cohort.status)) return { ok: false, status: 404 };

  for (const target of cohort.content) {
    const decision = decideSelfEnroll(target, role);
    if (!decision.ok) return decision;
  }

  if (!cohort.holdsSeat && cohort.capacity !== null && cohort.takenSeats >= cohort.capacity) {
    return { ok: false, status: 409 };
  }

  return { ok: true };
}
