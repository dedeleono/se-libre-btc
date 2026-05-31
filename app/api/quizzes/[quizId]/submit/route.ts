import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const normalize = (value: string, caseSensitive = false) => {
  const trimmed = value.trim();
  return caseSensitive ? trimmed : trimmed.toLowerCase();
};

const getAcceptedTextAnswers = (metadata: unknown) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { answers: [] as string[], caseSensitive: false };
  }

  const value = metadata as {
    correctAnswer?: unknown;
    acceptedAnswers?: unknown;
    caseSensitive?: unknown;
  };
  const answers = [
    typeof value.correctAnswer === "string" ? value.correctAnswer : "",
    ...(Array.isArray(value.acceptedAnswers)
      ? value.acceptedAnswers.filter((item): item is string => typeof item === "string")
      : []),
  ].filter(Boolean);

  return {
    answers,
    caseSensitive: value.caseSensitive === true,
  };
};

export async function POST(
  req: Request,
  { params }: { params: { quizId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const submittedAnswers = Array.isArray(body.answers) ? body.answers : [];

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      chapter: true,
      questions: {
        include: { options: true },
        orderBy: { position: "asc" },
      },
      attempts: {
        where: { userId: userId, status: "COMPLETED" },
      },
    },
  });

  if (!quiz) {
    return new NextResponse("Quiz not found", { status: 404 });
  }

  if (!quiz.allowRetries && quiz.attempts.length > 0) {
    return new NextResponse("Retries are not allowed for this quiz", { status: 400 });
  }

  const totalPoints = quiz.questions.reduce((sum, question) => sum + question.points, 0) || 1;
  let earnedPoints = 0;

  const answers = quiz.questions.map((question) => {
    const submitted = submittedAnswers.find((answer: any) => answer.questionId === question.id) || {};
    const selectedOptionIds = Array.isArray(submitted.selectedOptionIds)
      ? submitted.selectedOptionIds
      : [];
    const textAnswer = typeof submitted.textAnswer === "string" ? submitted.textAnswer : null;

    let isCorrect = false;
    if (question.type === "FILL_IN_THE_BLANK") {
      const metadata = getAcceptedTextAnswers(question.metadata);
      const submittedText = textAnswer ? normalize(textAnswer, metadata.caseSensitive) : "";
      isCorrect =
        metadata.answers.length > 0 &&
        !!submittedText &&
        metadata.answers.some((answer) => normalize(answer, metadata.caseSensitive) === submittedText);
    } else {
      const correctOptionIds = question.options
        .filter((option) => option.isCorrect)
        .map((option) => option.id)
        .sort();
      const selected = [...selectedOptionIds].sort();
      isCorrect =
        correctOptionIds.length > 0 &&
        correctOptionIds.length === selected.length &&
        correctOptionIds.every((id, index) => selected[index] === id);
    }

    if (isCorrect) {
      earnedPoints += question.points;
    }

    return {
      questionId: question.id,
      selectedOptionIds,
      textAnswer,
      isCorrect,
    };
  });

  const scorePercent = Math.round((earnedPoints / totalPoints) * 1000) / 10;

  const attempt = await prisma.$transaction(async (tx) => {
    const createdAttempt = await tx.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: userId,
        status: "COMPLETED",
        scorePercent,
        passed: true,
        completedAt: new Date(),
        answers: { create: answers },
      },
      include: {
        answers: true,
      },
    });

    await tx.chapterProgress.upsert({
      where: {
        userId_chapterId: {
          userId: userId,
          chapterId: quiz.chapterId,
        },
      },
      create: {
        userId: userId,
        chapterId: quiz.chapterId,
        isCompleted: true,
        completedAt: new Date(),
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    return createdAttempt;
  });

  return NextResponse.json({
    attempt,
    scorePercent,
    showCorrectAnswers: quiz.showCorrectAnswers,
    questions: quiz.showCorrectAnswers ? quiz.questions : [],
  });
}
