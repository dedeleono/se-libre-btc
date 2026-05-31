import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const operations = [];

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

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    // Delete the pending invitation
    await prisma.pendingInvitation.delete({
      where: {
        id: invitationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[COMPLETE_INVITATION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
