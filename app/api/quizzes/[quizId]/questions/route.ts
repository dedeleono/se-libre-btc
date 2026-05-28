import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { quizId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
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
      points: Number(body.points ?? 1),
      position: lastQuestion ? lastQuestion.position + 1 : 1,
      metadata: body.metadata,
      options: body.options?.length
        ? {
            create: body.options.map((option: any, index: number) => ({
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
