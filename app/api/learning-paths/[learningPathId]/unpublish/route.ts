import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, props: { params: Promise<{ learningPathId: string }> }) {
  const params = await props.params;
  const authz = await requireAdminApi();
  if (!authz.ok) return authz.response;

  const learningPath = await prisma.learningPath.update({
    where: { id: params.learningPathId },
    data: { isPublished: false, publishedAt: null },
  });

  return NextResponse.json(learningPath);
}
