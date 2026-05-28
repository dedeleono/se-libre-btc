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

  const learningPath = await prisma.learningPath.update({
    where: { id: params.learningPathId },
    data: { isPublished: true, publishedAt: new Date() },
  });

  return NextResponse.json(learningPath);
}
