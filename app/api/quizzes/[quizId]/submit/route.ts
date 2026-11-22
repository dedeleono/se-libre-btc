import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProgress } from "@/actions/get-progress";
import { resolveFinalQuiz } from "@/lib/certificate-eligibility";
import { hasCourseEnrollmentAccess } from "@/lib/chapter-access";
import { decideChapterWrite } from "@/lib/chapter-write-policy";
import { shouldRevealAnswers, toAnswerKey } from "@/lib/quiz-dto";
import { scoreAttempt } from "@/lib/quiz-scoring";

const bodySchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        selectedOptionIds: z.array(z.string()).default([]),
        textAnswer: z.string().nullable().default(null),
      })
    )
    .default([]),
});

export async function POST(req: Request, props: { params: Promise<{ quizId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  const parsed = bodySchema.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success) {
    return new NextResponse("Invalid submission", { status: 400 });
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    select: {
      id: true,
      allowRetries: true,
      showCorrectAnswers: true,
      chapterId: true,
      chapter: {
        select: { type: true, isPublished: true, isIntro: true, module: { select: { courseId: true } } },
      },
      questions: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          type: true,
          metadata: true,
          explanation: true,
          options: { select: { id: true, isCorrect: true } },
        },
      },
      attempts: { where: { userId, status: "COMPLETED" }, select: { id: true }, take: 1 },
    },
  });

  if (!quiz) {
    return new NextResponse("Quiz not found", { status: 404 });
  }

  const courseId = quiz.chapter.module.courseId;
  const [hasEnrollment, { finalQuiz }] = await Promise.all([
    isAdmin ? true : hasCourseEnrollmentAccess(userId, courseId),
    resolveFinalQuiz(courseId),
  ]);

  const decision = decideChapterWrite({
    chapter: {
      courseId,
      type: quiz.chapter.type,
      isPublished: quiz.chapter.isPublished,
      isIntro: quiz.chapter.isIntro,
    },
    expectedCourseId: courseId,
    isAdmin,
    hasEnrollment,
    action: "SUBMIT_QUIZ",
  });
  if (!decision.ok) {
    return new NextResponse(decision.reason, { status: decision.status });
  }

  if (!quiz.allowRetries && quiz.attempts.length > 0) {
    return new NextResponse("Retries are not allowed for this quiz", { status: 400 });
  }

  const scored = scoreAttempt(quiz.questions, parsed.data.answers);

  const attempt = await prisma.$transaction(async (tx) => {
    const createdAttempt = await tx.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: userId,
        status: "COMPLETED",
        scorePercent: scored.scorePercent,
        passed: true,
        completedAt: new Date(),
        answers: { create: scored.answers },
      },
      select: { id: true },
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

  // Roll up course-level completion exactly like the lesson path
  // (chapters/[chapterId]/progress/route.ts). Completing a quiz chapter can be
  // the final step of a course, so stamp the enrollment and tell the client to
  // route the student to the certificate / Maverick page.
  const percent = await getProgress(userId, courseId);
  const courseCompleted = percent >= 100;
  if (courseCompleted) {
    await prisma.courseEnrollment.updateMany({
      where: { userId, courseId, completedAt: null },
      data: { completedAt: new Date() },
    });
  }

  const reveal = shouldRevealAnswers({
    showCorrectAnswers: quiz.showCorrectAnswers,
    isFinalExam: finalQuiz?.id === quiz.id,
    scorePercent: scored.scorePercent,
  });

  return NextResponse.json({
    attemptId: attempt.id,
    scorePercent: scored.scorePercent,
    courseId,
    courseCompleted,
    showCorrectAnswers: reveal,
    answerKey: reveal ? toAnswerKey(quiz.questions) : [],
  });
}
