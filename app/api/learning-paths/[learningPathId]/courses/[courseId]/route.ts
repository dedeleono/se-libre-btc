import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { learningPathId: string; courseId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await prisma.learningPathCourse.delete({
    where: {
      learningPathId_courseId: {
        learningPathId: params.learningPathId,
        courseId: params.courseId,
      },
    },
  });

  return NextResponse.json({ success: true });
}
