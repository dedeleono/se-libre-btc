import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withFallbackSlug } from "@/lib/slug";

export async function GET() {
  const learningPaths = await prisma.learningPath.findMany({
    where: { isPublished: true },
    include: {
      courses: true,
      enrollments: true,
    },
    orderBy: { position: "asc" },
  });

  return NextResponse.json(learningPaths);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const title = body.title as string | undefined;

  if (!title) {
    return new NextResponse("Title is required", { status: 400 });
  }

  const position = await prisma.learningPath.count();
  const baseSlug = body.slug
    ? withFallbackSlug(body.slug, "learning-path")
    : withFallbackSlug(title, "learning-path");
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.learningPath.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const learningPath = await prisma.learningPath.create({
    data: {
      title,
      slug,
      description: body.description,
      imageUrl: body.imageUrl,
      position,
      isFree: body.isFree ?? true,
      price: body.price,
    },
  });

  return NextResponse.json(learningPath);
}
