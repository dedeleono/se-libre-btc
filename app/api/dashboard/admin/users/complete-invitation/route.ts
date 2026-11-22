import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkInvitationClaim } from "@/lib/invitation-claim";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { invitationId } = body;

    if (!invitationId) {
      return new NextResponse("Invitation ID is required", { status: 400 });
    }

    const pendingInvitation = await prisma.pendingInvitation.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        payment: true,
        course: true,
        learningPath: { include: { courses: true } },
        cohort: true,
      },
    });

    if (!pendingInvitation) {
      return new NextResponse("Invitation not found", { status: 404 });
    }

    const claim = checkInvitationClaim(pendingInvitation, session.user.email, new Date());
    if (!claim.ok) {
      return new NextResponse(claim.status === 403 ? "Forbidden" : "Invitation has expired", { status: claim.status });
    }

    const operations: Prisma.PrismaPromise<unknown>[] = [];

    if (pendingInvitation.courseId) {
      operations.push(prisma.courseEnrollment.upsert({
        where: { userId_courseId: { userId, courseId: pendingInvitation.courseId } },
        create: { userId, courseId: pendingInvitation.courseId, source: "INVITATION" },
        update: { status: "ACTIVE" },
      }));
    }

    if (pendingInvitation.learningPathId) {
      operations.push(prisma.learningPathEnrollment.upsert({
        where: { userId_learningPathId: { userId, learningPathId: pendingInvitation.learningPathId } },
        create: { userId, learningPathId: pendingInvitation.learningPathId, source: "INVITATION" },
        update: { status: "ACTIVE" },
      }));

      pendingInvitation.learningPath?.courses.forEach((pathCourse) => {
        operations.push(prisma.courseEnrollment.upsert({
          where: { userId_courseId: { userId, courseId: pathCourse.courseId } },
          create: { userId, courseId: pathCourse.courseId, source: "LEARNING_PATH" },
          update: { status: "ACTIVE" },
        }));
      });
    }

    if (pendingInvitation.cohortId) {
      operations.push(prisma.cohortEnrollment.upsert({
        where: { userId_cohortId: { userId, cohortId: pendingInvitation.cohortId } },
        create: { userId, cohortId: pendingInvitation.cohortId, source: "INVITATION" },
        update: { status: "ACTIVE" },
      }));
    }

    operations.push(prisma.pendingInvitation.deleteMany({ where: { id: invitationId } }));

    await prisma.$transaction(operations);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[COMPLETE_INVITATION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
