import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const quizSettingsSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  passingScore: z.coerce.number().int().min(0).max(100).default(0),
  allowRetries: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(true),
  isFinalExam: z.boolean().default(false),
});

export async function POST(req: Request, props: { params: Promise<{ chapterId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const parsed = quizSettingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quiz settings" }, { status: 400 });
  }

  const body = parsed.data;
  const chapter = await prisma.chapter.findUnique({
    where: { id: params.chapterId },
    select: { id: true, title: true, description: true },
  });

  if (!chapter) {
    return new NextResponse("Chapter not found", { status: 404 });
  }

  const quiz = await prisma.quiz.upsert({
    where: { chapterId: chapter.id },
    create: {
      chapterId: chapter.id,
      title: body.title || chapter.title,
      description: body.description ?? chapter.description,
      passingScore: body.passingScore,
      allowRetries: body.allowRetries,
      showCorrectAnswers: body.showCorrectAnswers,
      isFinalExam: body.isFinalExam,
    },
    update: {
      title: body.title || chapter.title,
      description: body.description ?? chapter.description,
      passingScore: body.passingScore,
      allowRetries: body.allowRetries,
      showCorrectAnswers: body.showCorrectAnswers,
      isFinalExam: body.isFinalExam,
    },
  });

  return NextResponse.json(quiz);
}
