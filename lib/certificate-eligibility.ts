import { prisma } from "./db";

export type CertificateEligibilityReason =
  | "ELIGIBLE"
  | "COURSE_NOT_COMPLETE"
  | "NO_FINAL_QUIZ"
  | "FINAL_QUIZ_SCORE_TOO_LOW";

export type CertificateEligibility = {
  eligible: boolean;
  reason: CertificateEligibilityReason;
  finalQuiz: { id: string; chapterId: string; title: string } | null;
  finalQuizHref: string | null;
  bestFinalQuizScorePercent: number | null;
};

export type CertificateEligibilityDb = {
  courseEnrollment: {
    findUnique(args: unknown): Promise<{ completedAt: Date | null } | null>;
  };
  course: {
    findUnique(args: unknown): Promise<{
      modules: Array<{
        chapters: Array<{
          id: string;
          title: string;
          quiz: { id: string; title: string } | null;
        }>;
      }>;
    } | null>;
  };
  quizAttempt: {
    findMany(args: unknown): Promise<Array<{ scorePercent: number | null }>>;
  };
};

type GetProgress = (userId: string, courseId: string) => Promise<number>;

type ProgressDb = CertificateEligibilityDb & {
  chapter: {
    findMany(args: unknown): Promise<Array<{ id: string }>>;
  };
  chapterProgress: {
    count(args: unknown): Promise<number>;
  };
};

const PERFECT_FINAL_QUIZ_SCORE = 100;

function emptyEligibility(reason: CertificateEligibilityReason): CertificateEligibility {
  return {
    eligible: false,
    reason,
    finalQuiz: null,
    finalQuizHref: null,
    bestFinalQuizScorePercent: null,
  };
}

async function getProgressFromDb(userId: string, courseId: string, db: ProgressDb) {
  const publishedChapters = await db.chapter.findMany({
    where: {
      module: { courseId },
      isPublished: true,
    },
    select: { id: true },
  });

  if (publishedChapters.length === 0) {
    return 0;
  }

  const completedChapters = await db.chapterProgress.count({
    where: {
      userId,
      chapterId: { in: publishedChapters.map((chapter) => chapter.id) },
      isCompleted: true,
    },
  });

  return (completedChapters / publishedChapters.length) * 100;
}

export async function getCertificateEligibility(
  userId: string,
  courseId: string,
  options: {
    db?: CertificateEligibilityDb;
    getProgress?: GetProgress;
  } = {}
): Promise<CertificateEligibility> {
  const db = options.db ?? (prisma as unknown as CertificateEligibilityDb);

  const enrollment = await db.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { completedAt: true },
  });

  const progress = enrollment?.completedAt
    ? 100
    : await (options.getProgress ?? ((id, cid) => getProgressFromDb(id, cid, db as unknown as ProgressDb)))(
        userId,
        courseId
      );
  const courseCompleted = !!enrollment?.completedAt || progress >= 100;
  if (!courseCompleted) {
    return emptyEligibility("COURSE_NOT_COMPLETE");
  }

  const course = await db.course.findUnique({
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
              quiz: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const finalQuizChapters =
    course?.modules
      .flatMap((module) => module.chapters)
      .filter((chapter) => chapter.quiz) ?? [];
  const finalQuizChapter = finalQuizChapters[finalQuizChapters.length - 1];

  if (!finalQuizChapter?.quiz) {
    return emptyEligibility("NO_FINAL_QUIZ");
  }

  const finalQuiz = {
    id: finalQuizChapter.quiz.id,
    chapterId: finalQuizChapter.id,
    title: finalQuizChapter.quiz.title || finalQuizChapter.title,
  };
  const finalQuizHref = `/courses/${courseId}/chapters/${finalQuiz.chapterId}`;

  const [bestAttempt] = await db.quizAttempt.findMany({
    where: {
      quizId: finalQuiz.id,
      userId,
      status: "COMPLETED",
      scorePercent: { not: null },
    },
    select: { scorePercent: true },
    orderBy: { scorePercent: "desc" },
    take: 1,
  });

  const bestFinalQuizScorePercent = bestAttempt?.scorePercent ?? null;
  const eligible = bestFinalQuizScorePercent === PERFECT_FINAL_QUIZ_SCORE;

  return {
    eligible,
    reason: eligible ? "ELIGIBLE" : "FINAL_QUIZ_SCORE_TOO_LOW",
    finalQuiz,
    finalQuizHref,
    bestFinalQuizScorePercent,
  };
}
