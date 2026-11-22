import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request, props: { params: Promise<{ learningPathId: string }> }) {
  const params = await props.params;
  const authz = await requireAdminApi();
  if (!authz.ok) return authz.response;

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
