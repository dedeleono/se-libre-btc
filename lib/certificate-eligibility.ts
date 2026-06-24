import { prisma } from "./db";

/**
 * Certificate eligibility rule:
 *   A student may only obtain a certificate for a course if they scored a
 *   perfect 100 on that course's *final* quiz — the last published quiz in
 *   course order (modules by position, then chapters by position).
 *
 * FAIL-CLOSED CONTRACT (important):
 *   For any course that has at least one quiz, a certificate is granted ONLY
 *   when we can resolve a final quiz AND the student has a 100 on it. If we
 *   cannot resolve the final quiz for such a course (e.g. the final-exam
 *   chapter was unpublished, the quiz relation is missing, or ordering is
 *   ambiguous), eligibility is DENIED — a detection miss must never silently
 *   hand out a certificate. This is what previously let students who did not
 *   ace the final exam download certificates.
 *
 *   The only auto-pass is a course with NO quizzes at all: there the rule
 *   genuinely does not apply, and certificates are issued on completion as
 *   before. Gating quiz-less courses would block every certificate they have
 *   ever issued.
 */
export const PERFECT_FINAL_QUIZ_SCORE = 100;

export type FinalQuizRef = { id: string; chapterId: string; title: string };

export type CertificateEligibilityReason =
  | "ELIGIBLE"
  | "NO_QUIZZES"
  | "FINAL_QUIZ_UNRESOLVED"
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
  quiz: { id: string; title: string; isFinalExam?: boolean } | null;
};

type ModuleWithChapters = { chapters: ChapterWithQuiz[] };

/**
 * The final quiz is, in priority order:
 *   1. the quiz explicitly marked `isFinalExam` (the last such one, in course
 *      order, if several are flagged), or
 *   2. the last published quiz chapter in course order (modules by position,
 *      then chapters by position) — the legacy positional heuristic.
 *
 * The explicit flag removes the dependency on the final exam always being the
 * last-ordered, still-published quiz. A trailing lesson/resource chapter after
 * the quiz does not change the answer.
 *
 * NOTE: callers must pass modules already ordered by position, with each
 * module's chapters ordered by position (getCertificateEligibility does this).
 */
export function pickFinalQuiz(modules: ModuleWithChapters[]): FinalQuizRef | null {
  const quizChapters = modules.flatMap((module) => module.chapters).filter((chapter) => chapter.quiz);
  const flagged = quizChapters.filter((chapter) => chapter.quiz?.isFinalExam);
  const pool = flagged.length > 0 ? flagged : quizChapters;
  const last = pool[pool.length - 1];
  if (!last?.quiz) return null;
  return { id: last.quiz.id, chapterId: last.id, title: last.quiz.title || last.title };
}

/** True if the course has any quiz chapter at all (published or not). */
export function courseHasAnyQuiz(modules: ModuleWithChapters[]): boolean {
  return modules.some((module) => module.chapters.some((chapter) => chapter.quiz));
}

/**
 * Pure evaluation of the rule.
 *
 * @param finalQuiz       the resolved final quiz, or null if none could be resolved
 * @param bestScore       best COMPLETED attempt score on that quiz, or null
 * @param courseHasQuiz   whether the course has ANY quiz at all
 *
 * Decision table:
 *   - finalQuiz present + best >= 100        -> ELIGIBLE
 *   - finalQuiz present + best  < 100/none   -> NOT eligible (FINAL_QUIZ_SCORE_TOO_LOW)
 *   - no finalQuiz, course has quizzes       -> NOT eligible (FINAL_QUIZ_UNRESOLVED) [fail closed]
 *   - no finalQuiz, course has no quizzes    -> eligible (NO_QUIZZES, rule N/A)
 */
export function evaluateEligibility(
  courseId: string,
  finalQuiz: FinalQuizRef | null,
  bestFinalQuizScorePercent: number | null,
  courseHasQuiz: boolean
): CertificateEligibility {
  if (!finalQuiz) {
    // A course with no quizzes at all is the only legitimate auto-pass.
    if (!courseHasQuiz) {
      return {
        eligible: true,
        reason: "NO_QUIZZES",
        finalQuiz: null,
        finalQuizHref: null,
        bestFinalQuizScorePercent: null,
      };
    }
    // The course has quizzes but we could not resolve the final one. Fail closed.
    return {
      eligible: false,
      reason: "FINAL_QUIZ_UNRESOLVED",
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
  // Pull published chapters (used to resolve the final quiz in course order) and,
  // separately, whether the course has ANY quiz at all (published or not). The
  // latter decides whether a missing final quiz is a legacy quiz-less course
  // (auto-pass) or a detection miss on a quiz course (fail closed).
  const [course, anyQuiz] = await Promise.all([
    prisma.course.findUnique({
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
                quiz: { select: { id: true, title: true, isFinalExam: true } },
              },
            },
          },
        },
      },
    }),
    prisma.quiz.findFirst({
      where: { chapter: { module: { courseId } } },
      select: { id: true },
    }),
  ]);

  const modules = course?.modules ?? [];
  const courseHasQuiz = anyQuiz != null || courseHasAnyQuiz(modules);
  const finalQuiz = pickFinalQuiz(modules);

  if (!finalQuiz) return evaluateEligibility(courseId, null, null, courseHasQuiz);

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

  return evaluateEligibility(courseId, finalQuiz, best?.scorePercent ?? null, courseHasQuiz);
}
