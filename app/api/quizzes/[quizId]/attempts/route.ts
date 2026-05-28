import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { quizId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: { attempts: { where: { userId: session.user.id, status: "COMPLETED" } } },
  });

  if (!quiz) {
    return new NextResponse("Quiz not found", { status: 404 });
  }

  if (!quiz.allowRetries && quiz.attempts.length > 0) {
    return new NextResponse("Retries are not allowed for this quiz", { status: 400 });
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId: session.user.id,
    },
  });

  return NextResponse.json(attempt);
}
