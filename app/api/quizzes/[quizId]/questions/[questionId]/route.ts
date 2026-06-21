import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { quizQuestionPayloadSchema } from "@/lib/validations/quiz";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ quizId: string; questionId: string }> }
) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const parsed = quizQuestionPayloadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid question payload" },
      { status: 400 }
    );
  }

  const body = parsed.data;

  try {
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
          points: 1,
          metadata: body.metadata === undefined ? undefined : body.metadata ?? Prisma.JsonNull,
        },
      });

      await tx.quizOption.deleteMany({
        where: { questionId: params.questionId },
      });

      if (body.options.length > 0) {
        await tx.quizOption.createMany({
          data: body.options.map((option, index) => ({
            questionId: params.questionId,
            content: option.content,
            isCorrect: Boolean(option.isCorrect),
            position: option.position ?? index + 1,
          })),
        });
      }

      return tx.quizQuestion.findUnique({
        where: { id: params.questionId },
        include: { options: { orderBy: { position: "asc" } } },
      });
    });

    return NextResponse.json(question);
  } catch (error) {
    if (error instanceof Error && error.message === "QUESTION_NOT_FOUND") {
      return new NextResponse("Question not found", { status: 404 });
    }

    throw error;
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ quizId: string; questionId: string }> }
) {
  const params = await props.params;
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
