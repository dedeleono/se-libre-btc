import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withFallbackSlug } from "@/lib/slug";

export async function PATCH(
  req: Request,
  { params }: { params: { cohortId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const current = await prisma.cohort.findUnique({ where: { id: params.cohortId } });
  if (!current) {
    return new NextResponse("Cohort not found", { status: 404 });
  }

  let slug = body.slug ? withFallbackSlug(body.slug, "cohort") : undefined;
  if (slug && slug !== current.slug) {
    const baseSlug = slug;
    let suffix = 1;
    while (await prisma.cohort.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  const cohort = await prisma.cohort.update({
    where: { id: params.cohortId },
    data: {
      title: body.title,
      slug,
      description: body.description,
      status: body.status,
      capacity: body.capacity === "" || body.capacity === null ? null : Number(body.capacity),
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      courseId: body.courseId || null,
      learningPathId: body.learningPathId || null,
    },
  });

  return NextResponse.json(cohort);
}

export async function DELETE(
  req: Request,
  { params }: { params: { cohortId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await prisma.cohort.delete({ where: { id: params.cohortId } });

  return NextResponse.json({ success: true });
}
