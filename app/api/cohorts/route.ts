import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { withFallbackSlug } from "@/lib/slug";

export async function POST(req: Request) {
  const authz = await requireAdminApi();
  if (!authz.ok) return authz.response;

  const body = await req.json();
  if (!body.title) {
    return new NextResponse("Title is required", { status: 400 });
  }

  const baseSlug = body.slug
    ? withFallbackSlug(body.slug, "cohort")
    : withFallbackSlug(body.title, "cohort");
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.cohort.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const capacity =
    body.capacity === "" || body.capacity == null || Number.isNaN(Number(body.capacity))
      ? null
      : Number(body.capacity);

  const cohort = await prisma.cohort.create({
    data: {
      title: body.title,
      slug,
      description: body.description,
      status: body.status || "DRAFT",
      capacity,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      courseId: body.courseId || null,
      learningPathId: body.learningPathId || null,
    },
  });

  return NextResponse.json(cohort);
}
