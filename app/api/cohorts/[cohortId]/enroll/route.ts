import { NextResponse } from "next/server";
import { EnrollmentStatus, Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decideCohortEnroll } from "@/lib/enrollment-policy";

export async function POST(req: Request, props: { params: Promise<{ cohortId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const cohort = await prisma.cohort.findUnique({
    where: { id: params.cohortId },
    include: {
      course: { select: { isPublished: true, isFree: true } },
      learningPath: { include: { courses: true } },
    },
  });

  if (!cohort) {
    return new NextResponse(null, { status: 404 });
  }

  const seatStatuses: EnrollmentStatus[] = ["ACTIVE", "COMPLETED"];
  const [takenSeats, existingSeat] = await Promise.all([
    prisma.cohortEnrollment.count({ where: { cohortId: cohort.id, status: { in: seatStatuses } } }),
    prisma.cohortEnrollment.findFirst({
      where: { cohortId: cohort.id, userId, status: { in: seatStatuses } },
      select: { id: true },
    }),
  ]);

  const decision = decideCohortEnroll(
    {
      status: cohort.status,
      capacity: cohort.capacity,
      takenSeats,
      holdsSeat: existingSeat !== null,
      content: [cohort.course, cohort.learningPath].filter((target) => target !== null),
    },
    session.user.role
  );
  if (!decision.ok) {
    return new NextResponse(null, { status: decision.status });
  }

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.cohortEnrollment.upsert({
      where: {
        userId_cohortId: {
          userId,
          cohortId: cohort.id,
        },
      },
      create: {
        userId,
        cohortId: cohort.id,
        source: "COHORT",
      },
      update: { status: "ACTIVE" },
    }),
  ];

  if (cohort.courseId) {
    operations.push(
      prisma.courseEnrollment.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId: cohort.courseId,
          },
        },
        create: {
          userId,
          courseId: cohort.courseId,
          source: "COHORT",
        },
        update: { status: "ACTIVE" },
      })
    );
  }

  if (cohort.learningPathId && cohort.learningPath) {
    operations.push(
      prisma.learningPathEnrollment.upsert({
        where: {
          userId_learningPathId: {
            userId,
            learningPathId: cohort.learningPathId,
          },
        },
        create: {
          userId,
          learningPathId: cohort.learningPathId,
          source: "COHORT",
        },
        update: { status: "ACTIVE" },
      }),
      ...cohort.learningPath.courses.map((pathCourse) =>
        prisma.courseEnrollment.upsert({
          where: {
            userId_courseId: {
              userId,
              courseId: pathCourse.courseId,
            },
          },
          create: {
            userId,
            courseId: pathCourse.courseId,
            source: "COHORT",
          },
          update: { status: "ACTIVE" },
        })
      )
    );
  }

  await prisma.$transaction(operations);

  return NextResponse.json({
    message: "Cohort enrollment complete",
  });
}
