import type { ChapterType } from "@prisma/client";

export type ChapterWriteTarget = {
  courseId: string;
  type: ChapterType;
  isPublished: boolean;
  isIntro: boolean;
};

export type ChapterWriteDecision =
  | { ok: true }
  | { ok: false; status: 404; reason: "CHAPTER_NOT_FOUND" }
  | { ok: false; status: 403; reason: "NOT_ENROLLED" }
  | { ok: false; status: 409; reason: "QUIZ_CHAPTER_REQUIRES_SUBMISSION" };

const NOT_FOUND = { ok: false, status: 404, reason: "CHAPTER_NOT_FOUND" } as const;

export function decideChapterWrite(input: {
  chapter: ChapterWriteTarget | null;
  expectedCourseId: string;
  isAdmin: boolean;
  hasEnrollment: boolean;
  action: "COMPLETE_CHAPTER" | "SUBMIT_QUIZ";
}): ChapterWriteDecision {
  const { chapter, isAdmin, action } = input;

  if (!chapter || chapter.courseId !== input.expectedCourseId) return NOT_FOUND;
  if (!chapter.isPublished && !isAdmin) return NOT_FOUND;
  if (action === "COMPLETE_CHAPTER" && chapter.type === "QUIZ") {
    return { ok: false, status: 409, reason: "QUIZ_CHAPTER_REQUIRES_SUBMISSION" };
  }
  if (action === "SUBMIT_QUIZ" && chapter.type !== "QUIZ") return NOT_FOUND;
  if (isAdmin || chapter.isIntro || input.hasEnrollment) return { ok: true };
  return { ok: false, status: 403, reason: "NOT_ENROLLED" };
}
