"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateSerial, prefillRecipientName } from "@/lib/certificate";
import { getCertificateEligibility } from "@/lib/certificate-eligibility";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

async function assertCertificateEligible(userId: string, courseId: string) {
  const eligibility = await getCertificateEligibility(userId, courseId);
  if (!eligibility.eligible) throw new Error(eligibility.reason);
}

export type CertificateSummary = {
  id: string;
  serial: string;
  recipientName: string;
  design: "STANDARD" | "PUNK";
  updatedAt: Date;
};

function toSummary(c: CertificateSummary): CertificateSummary {
  return {
    id: c.id,
    serial: c.serial,
    recipientName: c.recipientName,
    design: c.design,
    updatedAt: c.updatedAt,
  };
}

export async function ensureCertificate(courseId: string): Promise<CertificateSummary> {
  const userId = await requireUser();
  await assertCertificateEligible(userId, courseId);

  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) return toSummary(existing);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // Retry on the (extremely unlikely) serial collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const created = await prisma.certificate.create({
        data: {
          userId,
          courseId,
          serial: generateSerial(),
          recipientName: prefillRecipientName(user),
        },
      });
      return toSummary(created);
    } catch (err) {
      // Only a unique-constraint violation is recoverable here.
      if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") {
        throw err;
      }
      // Concurrent create on the same (userId, courseId) → return the existing row.
      const concurrent = await prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (concurrent) return toSummary(concurrent);
      // No row for this user/course → it was a serial collision; retry with a fresh serial.
      if (attempt === 4) throw err;
    }
  }
  throw new Error("CERTIFICATE_CREATE_FAILED");
}

export async function updateCertificate(input: {
  id: string;
  recipientName?: string;
  design?: "STANDARD" | "PUNK";
}) {
  const userId = await requireUser();
  const cert = await prisma.certificate.findUnique({ where: { id: input.id } });
  if (!cert || cert.userId !== userId) throw new Error("NOT_FOUND");
  await assertCertificateEligible(userId, cert.courseId);

  const data: { recipientName?: string; design?: "STANDARD" | "PUNK" } = {};
  if (input.recipientName !== undefined) {
    const name = input.recipientName.replace(/\s+/g, " ").trim();
    if (name.length < 1 || name.length > 80) throw new Error("INVALID_NAME");
    data.recipientName = name;
  }
  if (input.design !== undefined) data.design = input.design;

  const updated = await prisma.certificate.update({ where: { id: input.id }, data });
  return { ok: true as const, updatedAt: updated.updatedAt };
}
