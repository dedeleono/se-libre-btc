import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: { id: true, isFree: true, price: true },
  });

  if (!course) {
    return new NextResponse("Course not found", { status: 404 });
  }

  if (!course.isFree && Number(course.price ?? 0) > 0) {
    return NextResponse.json(
      { message: "Payment is required before enrollment." },
      { status: 402 }
    );
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
