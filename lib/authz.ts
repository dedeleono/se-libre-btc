import type { AppSession } from "@/lib/auth";

export type AdminDecision =
  | { ok: true; session: AppSession }
  | { ok: false; status: 401 | 403 };

export function decideAdmin(session: AppSession | null): AdminDecision {
  if (!session) return { ok: false, status: 401 };
  if (session.user.role !== "ADMIN") return { ok: false, status: 403 };
  return { ok: true, session };
}
