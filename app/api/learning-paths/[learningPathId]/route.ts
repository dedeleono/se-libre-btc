import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withFallbackSlug } from "@/lib/slug";

export async function PATCH(
  req: Request,
  { params }: { params: { learningPathId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const current = await prisma.learningPath.findUnique({
    where: { id: params.learningPathId },
  });

  if (!current) {
    return new NextResponse("Learning path not found", { status: 404 });
  }

  let slug = body.slug ? withFallbackSlug(body.slug, "learning-path") : undefined;
  if (slug && slug !== current.slug) {
    const baseSlug = slug;
    let suffix = 1;
    while (await prisma.learningPath.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  const learningPath = await prisma.learningPath.update({
    where: { id: params.learningPathId },
    data: {
      title: body.title,
      slug,
      description: body.description,
      imageUrl: body.imageUrl,
      isFree: body.isFree,
      price: body.price === "" || body.price === null ? null : body.price,
    },
  });

  return NextResponse.json(learningPath);
}

export async function DELETE(
  req: Request,
  { params }: { params: { learningPathId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await prisma.learningPath.delete({
    where: { id: params.learningPathId },
  });

  return NextResponse.json({ success: true });
}
