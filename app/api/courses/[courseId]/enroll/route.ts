import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: { id: true },
  });

  if (!course) {
    return new NextResponse("Course not found", { status: 404 });
  }

  const enrollment = await prisma.courseEnrollment.upsert({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: course.id,
      },
    },
    create: {
      userId: session.user.id,
      courseId: course.id,
      source: session.user.role === "ADMIN" ? "ADMIN" : "FREE",
      lastAccessedAt: new Date(),
    },
    update: {
      status: "ACTIVE",
      lastAccessedAt: new Date(),
    },
  });

  return NextResponse.json({
    enrollment,
    message: "Course enrollment complete",
  });
}
