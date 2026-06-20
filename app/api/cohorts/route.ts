import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withFallbackSlug } from "@/lib/slug";

export async function GET() {
  const cohorts = await prisma.cohort.findMany({
    include: { course: true, learningPath: true, liveSessions: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cohorts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

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
