import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { learningPathId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const learningPath = await prisma.learningPath.findUnique({
    where: { id: params.learningPathId },
    include: { courses: true },
  });

  if (!learningPath) {
    return new NextResponse("Learning path not found", { status: 404 });
  }

  if (!learningPath.isFree && Number(learningPath.price ?? 0) > 0) {
    return NextResponse.json(
      { message: "Payment is required before enrollment." },
      { status: 402 }
    );
  }

  const source = session.user.role === "ADMIN" ? "ADMIN" : "FREE";

  await prisma.$transaction([
    prisma.learningPathEnrollment.upsert({
      where: {
        userId_learningPathId: {
          userId,
          learningPathId: learningPath.id,
        },
      },
      create: {
        userId,
        learningPathId: learningPath.id,
        source,
      },
      update: { status: "ACTIVE" },
    }),
    ...learningPath.courses.map((pathCourse) =>
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
          source: "LEARNING_PATH",
        },
        update: { status: "ACTIVE" },
      })
    ),
  ]);

  return NextResponse.json({
    message: "Learning path enrollment complete",
  });
}
