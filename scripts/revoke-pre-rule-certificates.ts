// Revokes certificates that fail the final-exam rule in lib/certificate-eligibility. Run: npx tsx scripts/revoke-pre-rule-certificates.ts [--apply]

import { prisma } from "../lib/db";
import { getCertificateEligibility } from "../lib/certificate-eligibility";
import {
  PRE_RULE_REVOKED_REASON,
  selectCertificatesToRevoke,
  type CertificateCheck,
} from "../lib/certificate-revocation";

const BATCH_SIZE = 100;

async function main() {
  const apply = process.argv.includes("--apply");

  const certificates = await prisma.certificate.findMany({
    where: { revokedAt: null },
    select: { id: true, userId: true, courseId: true, revokedAt: true },
    orderBy: { id: "asc" },
  });

  const checks: CertificateCheck[] = [];
  for (const certificate of certificates) {
    const eligibility = await getCertificateEligibility(certificate.userId, certificate.courseId);
    checks.push({ id: certificate.id, revokedAt: certificate.revokedAt, eligibility });
  }

  const plan = selectCertificatesToRevoke(checks);
  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`Checked: ${plan.checked}`);
  console.log(`Eligible: ${plan.eligible}`);
  console.log(`To revoke: ${plan.toRevoke.length}`);
  console.log("By reason:", plan.byReason);
  console.log("Certificate ids to revoke:", plan.toRevoke);
  console.log(`Needs review: ${plan.needsReview.length}`);
  if (plan.needsReview.length > 0) {
    console.log("These certificates belong to courses whose final exam can't be resolved. Fix the course's final exam, then re-run. They are never revoked automatically.");
    console.log("Certificate ids needing review:", plan.needsReview);
  }

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to revoke.");
    return;
  }

  const revokedAt = new Date();
  let revoked = 0;
  for (let start = 0; start < plan.toRevoke.length; start += BATCH_SIZE) {
    const batch = plan.toRevoke.slice(start, start + BATCH_SIZE);
    const result = await prisma.$transaction((tx) =>
      tx.certificate.updateMany({
        where: { id: { in: batch }, revokedAt: null },
        data: { revokedAt, revokedReason: PRE_RULE_REVOKED_REASON },
      })
    );
    revoked += result.count;
  }
  console.log(`Revoked: ${revoked}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
