import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { invitationExpiry, parseInvitationRequest, type InvitationAccess } from "@/lib/invitation-request";
import { createInvitationToken } from "@/lib/utils";
import { sendInvitationEmail } from "@/lib/validations/invitation-email";

export const dynamic = "force-dynamic";

type InvitationError = "invalid_request" | "access_not_found" | "account_exists" | "already_invited" | "email_failed";

const fail = (error: InvitationError, status: number) => NextResponse.json({ error }, { status });

async function accessExists(access: InvitationAccess): Promise<boolean> {
  switch (access.type) {
    case "none":
      return true;
    case "course":
      return (await prisma.course.count({ where: { id: access.id } })) > 0;
    case "learningPath":
      return (await prisma.learningPath.count({ where: { id: access.id } })) > 0;
    case "cohort":
      return (await prisma.cohort.count({ where: { id: access.id } })) > 0;
  }
}

function accessColumns(access: InvitationAccess) {
  return {
    courseId: access.type === "course" ? access.id : null,
    learningPathId: access.type === "learningPath" ? access.id : null,
    cohortId: access.type === "cohort" ? access.id : null,
  };
}

export async function POST(req: Request) {
  const authz = await requireAdminApi();
  if (!authz.ok) return authz.response;

  const parsed = parseInvitationRequest(await req.json().catch(() => null));
  if (!parsed.ok) return fail("invalid_request", 400);

  const { firstName, lastName, email, access } = parsed.data;

  try {
    if (!(await accessExists(access))) return fail("access_not_found", 400);

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (existingUser) return fail("account_exists", 409);

    const now = new Date();
    const token = createInvitationToken();

    const invitation = await prisma.$transaction(async (tx) => {
      await tx.pendingInvitation.deleteMany({ where: { email, expires: { lte: now } } });
      return tx.pendingInvitation.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          role: "STUDENT",
          token,
          expires: invitationExpiry(now),
          ...accessColumns(access),
          metadata: { invitedBy: authz.session.user.id },
        },
        select: { id: true, email: true, expires: true },
      });
    });

    const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const inviteUrl = new URL("/api/auth/verify-invitation", baseUrl);
    inviteUrl.searchParams.set("token", token);

    try {
      await sendInvitationEmail(email, inviteUrl.toString());
    } catch (error) {
      console.error("[ADMIN_INVITATIONS_EMAIL]", error);
      await prisma.pendingInvitation.deleteMany({ where: { id: invitation.id } });
      return fail("email_failed", 502);
    }

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("already_invited", 409);
    }
    console.error("[ADMIN_INVITATIONS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
