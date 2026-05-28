import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { quizId: string; questionId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();

  const question = await prisma.$transaction(async (tx) => {
    const existingQuestion = await tx.quizQuestion.findFirst({
      where: { id: params.questionId, quizId: params.quizId },
      select: { id: true },
    });

    if (!existingQuestion) {
      throw new Error("QUESTION_NOT_FOUND");
    }

    await tx.quizQuestion.update({
      where: { id: params.questionId },
      data: {
        prompt: body.prompt,
        type: body.type,
        explanation: body.explanation,
        points: body.points === undefined ? undefined : Number(body.points),
        metadata: body.metadata,
      },
    });

    if (Array.isArray(body.options)) {
      await tx.quizOption.deleteMany({
        where: { questionId: params.questionId },
      });
      if (body.options.length > 0) {
        await tx.quizOption.createMany({
          data: body.options.map((option: any, index: number) => ({
            questionId: params.questionId,
            content: option.content,
            isCorrect: Boolean(option.isCorrect),
            position: option.position ?? index + 1,
          })),
        });
      }
    }

    return tx.quizQuestion.findUnique({
      where: { id: params.questionId },
      include: { options: { orderBy: { position: "asc" } } },
    });
  });

  return NextResponse.json(question);
}

export async function DELETE(
  req: Request,
  { params }: { params: { quizId: string; questionId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const question = await prisma.quizQuestion.findFirst({
    where: { id: params.questionId, quizId: params.quizId },
    select: { id: true },
  });

  if (!question) {
    return new NextResponse("Question not found", { status: 404 });
  }

  await prisma.quizQuestion.delete({
    where: { id: params.questionId },
  });

  return NextResponse.json({ success: true });
}
