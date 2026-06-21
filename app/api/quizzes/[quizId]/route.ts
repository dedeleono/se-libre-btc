import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const quizSettingsSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  passingScore: z.coerce.number().int().min(0).max(100).optional(),
  allowRetries: z.boolean().optional(),
  showCorrectAnswers: z.boolean().optional(),
});

export async function PATCH(req: Request, props: { params: Promise<{ quizId: string }> }) {
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
  const quiz = await prisma.quiz.update({
    where: { id: params.quizId },
    data: {
      title: body.title,
      description: body.description,
      passingScore: body.passingScore,
      allowRetries: body.allowRetries,
      showCorrectAnswers: body.showCorrectAnswers,
    },
  });

  return NextResponse.json(quiz);
}

export async function DELETE(req: Request, props: { params: Promise<{ quizId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const quiz = await prisma.quiz.delete({
    where: { id: params.quizId },
  });

  return NextResponse.json(quiz);
}
