import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { chapterId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const chapter = await prisma.chapter.findUnique({
    where: { id: params.chapterId },
    select: { id: true, title: true },
  });

  if (!chapter) {
    return new NextResponse("Chapter not found", { status: 404 });
  }

  const quiz = await prisma.quiz.upsert({
    where: { chapterId: chapter.id },
    create: {
      chapterId: chapter.id,
      title: body.title || chapter.title,
      description: body.description,
      passingScore: Number(body.passingScore ?? 70),
      allowRetries: body.allowRetries ?? true,
      showCorrectAnswers: body.showCorrectAnswers ?? true,
    },
    update: {
      title: body.title || chapter.title,
      description: body.description,
      passingScore: Number(body.passingScore ?? 70),
      allowRetries: body.allowRetries ?? true,
      showCorrectAnswers: body.showCorrectAnswers ?? true,
    },
  });

  return NextResponse.json(quiz);
}
