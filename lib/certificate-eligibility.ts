import { prisma } from "./db";

/**
 * Certificate eligibility rule:
 *   A student may only obtain a certificate for a course if they scored a
 *   perfect 100 on that course's *final* quiz — the last published quiz in
 *   course order.
 *
 * If a course has no final quiz at all, the rule simply does not apply and the
 * student stays eligible (certificates are issued on completion, as before).
 * This is intentional: gating quiz-less courses would block every certificate
 * they have ever issued.
 */
export const PERFECT_FINAL_QUIZ_SCORE = 100;

export type FinalQuizRef = { id: string; chapterId: string; title: string };

export type CertificateEligibilityReason =
  | "ELIGIBLE"
  | "NO_FINAL_QUIZ"
  | "FINAL_QUIZ_SCORE_TOO_LOW";

export type CertificateEligibility = {
  eligible: boolean;
  reason: CertificateEligibilityReason;
  finalQuiz: FinalQuizRef | null;
  finalQuizHref: string | null;
  bestFinalQuizScorePercent: number | null;
};

type ChapterWithQuiz = {
  id: string;
  title: string;
  quiz: { id: string; title: string } | null;
};

type ModuleWithChapters = { chapters: ChapterWithQuiz[] };

/**
 * The final quiz is the last published quiz chapter in course order
 * (modules by position, then chapters by position). A trailing lesson or
 * resource chapter after the quiz does not change the answer.
 */
export function pickFinalQuiz(modules: ModuleWithChapters[]): FinalQuizRef | null {
  const quizChapters = modules.flatMap((module) => module.chapters).filter((chapter) => chapter.quiz);
  const last = quizChapters[quizChapters.length - 1];
  if (!last?.quiz) return null;
  return { id: last.quiz.id, chapterId: last.id, title: last.quiz.title || last.title };
}

/** Pure evaluation of the rule given the resolved final quiz and best score. */
export function evaluateEligibility(
  courseId: string,
  finalQuiz: FinalQuizRef | null,
  bestFinalQuizScorePercent: number | null
): CertificateEligibility {
  if (!finalQuiz) {
    return {
      eligible: true,
      reason: "NO_FINAL_QUIZ",
      finalQuiz: null,
      finalQuizHref: null,
      bestFinalQuizScorePercent: null,
    };
  }

  const eligible =
    bestFinalQuizScorePercent != null && bestFinalQuizScorePercent >= PERFECT_FINAL_QUIZ_SCORE;

  return {
    eligible,
    reason: eligible ? "ELIGIBLE" : "FINAL_QUIZ_SCORE_TOO_LOW",
    finalQuiz,
    finalQuizHref: `/courses/${courseId}/chapters/${finalQuiz.chapterId}`,
    bestFinalQuizScorePercent,
  };
}

export async function getCertificateEligibility(
  userId: string,
  courseId: string
): Promise<CertificateEligibility> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      modules: {
        orderBy: { position: "asc" },
        select: {
          chapters: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              quiz: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });

  const finalQuiz = pickFinalQuiz(course?.modules ?? []);
  if (!finalQuiz) return evaluateEligibility(courseId, null, null);

  const best = await prisma.quizAttempt.findFirst({
    where: {
      quizId: finalQuiz.id,
      userId,
      status: "COMPLETED",
      scorePercent: { not: null },
    },
    orderBy: { scorePercent: "desc" },
    select: { scorePercent: true },
  });

  return evaluateEligibility(courseId, finalQuiz, best?.scorePercent ?? null);
}
