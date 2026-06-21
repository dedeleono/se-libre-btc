import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request, props: { params: Promise<{ learningPathId: string }> }) {
  const params = await props.params;
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
          lastAccessedAt: new Date(),
        },
        update: { status: "ACTIVE", lastAccessedAt: new Date() },
      })
    ),
  ]);

  return NextResponse.json({
    message: "Learning path enrollment complete",
  });
}
