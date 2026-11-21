import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ learningPathId: string; courseId: string }> }
) {
  const params = await props.params;
  const authz = await requireAdminApi();
  if (!authz.ok) return authz.response;

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
