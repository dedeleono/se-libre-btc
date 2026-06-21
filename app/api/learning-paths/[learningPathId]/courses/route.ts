import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request, props: { params: Promise<{ learningPathId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  if (!body.courseId) {
    return new NextResponse("Course is required", { status: 400 });
  }

  const position = await prisma.learningPathCourse.count({
    where: { learningPathId: params.learningPathId },
  });

  const pathCourse = await prisma.learningPathCourse.upsert({
    where: {
      learningPathId_courseId: {
        learningPathId: params.learningPathId,
        courseId: body.courseId,
      },
    },
    create: {
      learningPathId: params.learningPathId,
      courseId: body.courseId,
      position,
    },
    update: {},
  });

  return NextResponse.json(pathCourse);
}
