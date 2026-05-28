import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { learningPathId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

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
