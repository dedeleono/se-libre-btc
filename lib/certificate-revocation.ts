import { isCertificateValid } from "./certificate";
import type { CertificateEligibility, CertificateEligibilityReason } from "./certificate-eligibility";

export const PRE_RULE_REVOKED_REASON = "PRE_RULE_BELOW_100";

export type CertificateCheck = {
  id: string;
  revokedAt: Date | null;
  eligibility: Pick<CertificateEligibility, "eligible" | "reason">;
};

export type RevocationPlan = {
  checked: number;
  eligible: number;
  alreadyRevoked: number;
  byReason: Partial<Record<CertificateEligibilityReason, number>>;
  toRevoke: string[];
};

export function selectCertificatesToRevoke(checks: CertificateCheck[]): RevocationPlan {
  const plan: RevocationPlan = { checked: 0, eligible: 0, alreadyRevoked: 0, byReason: {}, toRevoke: [] };

  for (const check of checks) {
    if (!isCertificateValid(check)) {
      plan.alreadyRevoked += 1;
      continue;
    }
    plan.checked += 1;
    const { eligible, reason } = check.eligibility;
    plan.byReason[reason] = (plan.byReason[reason] ?? 0) + 1;
    if (eligible) plan.eligible += 1;
    else plan.toRevoke.push(check.id);
  }

  return plan;
}
