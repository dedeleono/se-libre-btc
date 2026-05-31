import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { quizQuestionPayloadSchema } from "@/lib/validations/quiz";

export async function POST(
  req: Request,
  { params }: { params: { quizId: string } }
) {
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
  const lastQuestion = await prisma.quizQuestion.findFirst({
    where: { quizId: params.quizId },
    orderBy: { position: "desc" },
  });

  const question = await prisma.quizQuestion.create({
    data: {
      quizId: params.quizId,
      prompt: body.prompt,
      type: body.type,
      explanation: body.explanation,
      points: body.points,
      position: lastQuestion ? lastQuestion.position + 1 : 1,
      metadata: body.metadata === undefined ? undefined : body.metadata ?? Prisma.JsonNull,
      options: body.options?.length
        ? {
            create: body.options.map((option, index) => ({
              content: option.content,
              isCorrect: Boolean(option.isCorrect),
              position: option.position ?? index + 1,
            })),
          }
        : undefined,
    },
    include: { options: true },
  });

  return NextResponse.json(question);
}
