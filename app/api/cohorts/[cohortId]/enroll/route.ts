import { NextResponse } from "next/server";
import { EnrollmentStatus } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decideCohortEnroll, type EnrollDecision } from "@/lib/enrollment-policy";

const SEAT_STATUSES: EnrollmentStatus[] = ["ACTIVE", "COMPLETED"];

export async function POST(req: Request, props: { params: Promise<{ cohortId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const role = session.user.role;

  const decision = await prisma.$transaction(async (tx): Promise<EnrollDecision> => {
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Cohort" WHERE "id" = ${params.cohortId} FOR UPDATE`;
    if (locked.length === 0) return { ok: false, status: 404 };

    const cohort = await tx.cohort.findUniqueOrThrow({
      where: { id: params.cohortId },
      include: {
        course: { select: { isPublished: true, isFree: true } },
        learningPath: { include: { courses: true } },
      },
    });

    const [takenSeats, existingSeat] = await Promise.all([
      tx.cohortEnrollment.count({ where: { cohortId: cohort.id, status: { in: SEAT_STATUSES } } }),
      tx.cohortEnrollment.findFirst({
        where: { cohortId: cohort.id, userId, status: { in: SEAT_STATUSES } },
        select: { id: true },
      }),
    ]);

    const verdict = decideCohortEnroll(
      {
        status: cohort.status,
        capacity: cohort.capacity,
        takenSeats,
        holdsSeat: existingSeat !== null,
        content: [cohort.course, cohort.learningPath].filter((target) => target !== null),
      },
      role
    );
    if (!verdict.ok) return verdict;

    await tx.cohortEnrollment.upsert({
      where: { userId_cohortId: { userId, cohortId: cohort.id } },
      create: { userId, cohortId: cohort.id, source: "COHORT" },
      update: { status: "ACTIVE" },
    });

    const courseIds = [
      ...(cohort.courseId ? [cohort.courseId] : []),
      ...(cohort.learningPath?.courses.map((pathCourse) => pathCourse.courseId) ?? []),
    ];

    if (cohort.learningPathId) {
      await tx.learningPathEnrollment.upsert({
        where: { userId_learningPathId: { userId, learningPathId: cohort.learningPathId } },
        create: { userId, learningPathId: cohort.learningPathId, source: "COHORT" },
        update: { status: "ACTIVE" },
      });
    }

    for (const courseId of new Set(courseIds)) {
      await tx.courseEnrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId, source: "COHORT" },
        update: { status: "ACTIVE" },
      });
    }

    return { ok: true };
  });

  if (!decision.ok) {
    return new NextResponse(null, { status: decision.status });
  }

  return NextResponse.json({
    message: "Cohort enrollment complete",
  });
}
