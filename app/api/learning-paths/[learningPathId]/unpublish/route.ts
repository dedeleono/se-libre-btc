import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, props: { params: Promise<{ learningPathId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const learningPath = await prisma.learningPath.update({
    where: { id: params.learningPathId },
    data: { isPublished: false, publishedAt: null },
  });

  return NextResponse.json(learningPath);
}
