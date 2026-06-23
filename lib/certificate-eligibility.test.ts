import { describe, expect, it } from "vitest";
import { getCertificateEligibility, type CertificateEligibilityDb } from "./certificate-eligibility";

const completedAt = new Date("2026-06-23T12:00:00Z");

function quizChapter(chapterId: string, quizId: string, title = "Final quiz") {
  return {
    id: chapterId,
    title,
    quiz: {
      id: quizId,
      title,
    },
  };
}

function lessonChapter(chapterId: string, title = "Lesson") {
  return {
    id: chapterId,
    title,
    quiz: null,
  };
}

function createDb(input: {
  enrollmentCompletedAt?: Date | null;
  modules?: Array<{ chapters: Array<ReturnType<typeof quizChapter> | ReturnType<typeof lessonChapter>> }>;
  scores?: Array<number | null>;
}): CertificateEligibilityDb {
  return {
    courseEnrollment: {
      findUnique: async () => ({ completedAt: input.enrollmentCompletedAt ?? null }),
    },
    course: {
      findUnique: async () => ({ modules: input.modules ?? [] }),
    },
    quizAttempt: {
      findMany: async () => input.scores?.map((scorePercent) => ({ scorePercent })) ?? [],
    },
  };
}

describe("getCertificateEligibility", () => {
  it("rejects an incomplete course before checking the final quiz", async () => {
    const eligibility = await getCertificateEligibility("user-1", "course-1", {
      db: createDb({
        enrollmentCompletedAt: null,
        modules: [{ chapters: [quizChapter("chapter-1", "quiz-1")] }],
        scores: [100],
      }),
      getProgress: async () => 75,
    });

    expect(eligibility).toMatchObject({
      eligible: false,
      reason: "COURSE_NOT_COMPLETE",
      finalQuiz: null,
      finalQuizHref: null,
      bestFinalQuizScorePercent: null,
    });
  });

  it("rejects a completed course with no published final quiz", async () => {
    const eligibility = await getCertificateEligibility("user-1", "course-1", {
      db: createDb({
        enrollmentCompletedAt: completedAt,
        modules: [{ chapters: [lessonChapter("chapter-1")] }],
      }),
      getProgress: async () => 100,
    });

    expect(eligibility).toMatchObject({
      eligible: false,
      reason: "NO_FINAL_QUIZ",
      finalQuiz: null,
      finalQuizHref: null,
      bestFinalQuizScorePercent: null,
    });
  });

  it("rejects a completed course when the best final quiz attempt is below 100", async () => {
    const eligibility = await getCertificateEligibility("user-1", "course-1", {
      db: createDb({
        enrollmentCompletedAt: completedAt,
        modules: [{ chapters: [quizChapter("chapter-1", "quiz-1")] }],
        scores: [90, 80],
      }),
      getProgress: async () => 100,
    });

    expect(eligibility).toMatchObject({
      eligible: false,
      reason: "FINAL_QUIZ_SCORE_TOO_LOW",
      finalQuiz: { id: "quiz-1", chapterId: "chapter-1", title: "Final quiz" },
      finalQuizHref: "/courses/course-1/chapters/chapter-1",
      bestFinalQuizScorePercent: 90,
    });
  });

  it("accepts a completed course when any completed final quiz attempt is 100", async () => {
    const eligibility = await getCertificateEligibility("user-1", "course-1", {
      db: createDb({
        enrollmentCompletedAt: completedAt,
        modules: [{ chapters: [quizChapter("chapter-1", "quiz-1")] }],
        scores: [100, 75],
      }),
      getProgress: async () => 100,
    });

    expect(eligibility).toMatchObject({
      eligible: true,
      reason: "ELIGIBLE",
      finalQuiz: { id: "quiz-1", chapterId: "chapter-1", title: "Final quiz" },
      finalQuizHref: "/courses/course-1/chapters/chapter-1",
      bestFinalQuizScorePercent: 100,
    });
  });

  it("uses the last published quiz by module and chapter order", async () => {
    const eligibility = await getCertificateEligibility("user-1", "course-1", {
      db: createDb({
        enrollmentCompletedAt: completedAt,
        modules: [
          { chapters: [quizChapter("chapter-1", "quiz-1", "Earlier quiz")] },
          {
            chapters: [
              lessonChapter("chapter-2"),
              quizChapter("chapter-3", "quiz-3", "Final quiz"),
            ],
          },
        ],
        scores: [100],
      }),
      getProgress: async () => 100,
    });

    expect(eligibility.finalQuiz).toEqual({
      id: "quiz-3",
      chapterId: "chapter-3",
      title: "Final quiz",
    });
    expect(eligibility.finalQuizHref).toBe("/courses/course-1/chapters/chapter-3");
    expect(eligibility.eligible).toBe(true);
  });
});
