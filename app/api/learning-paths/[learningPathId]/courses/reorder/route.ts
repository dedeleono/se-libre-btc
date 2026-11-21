import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, props: { params: Promise<{ learningPathId: string }> }) {
  const params = await props.params;
  const authz = await requireAdminApi();
  if (!authz.ok) return authz.response;

  const { list } = await req.json();
  if (!Array.isArray(list)) {
    return new NextResponse("Invalid reorder payload", { status: 400 });
  }

  const ids = list.map((item) => item.id).filter(Boolean);
  const count = await prisma.learningPathCourse.count({
    where: { learningPathId: params.learningPathId, id: { in: ids } },
  });

  if (count !== ids.length) {
    return new NextResponse("Invalid course list", { status: 400 });
  }

  await prisma.$transaction(
    list.map((item) =>
      prisma.learningPathCourse.update({
        where: { id: item.id },
        data: { position: item.position },
      })
    )
  );

  return NextResponse.json({ success: true });
}
