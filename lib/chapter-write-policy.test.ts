import { describe, expect, it } from "vitest";

import { decideChapterWrite, type ChapterWriteTarget } from "./chapter-write-policy";

const chapter = (overrides: Partial<ChapterWriteTarget> = {}): ChapterWriteTarget => ({
  courseId: "course-1",
  type: "LESSON",
  isPublished: true,
  isIntro: false,
  ...overrides,
});

type Input = Parameters<typeof decideChapterWrite>[0];

const decide = (overrides: Partial<Input> = {}) =>
  decideChapterWrite({
    chapter: chapter(),
    expectedCourseId: "course-1",
    isAdmin: false,
    hasEnrollment: true,
    action: "COMPLETE_CHAPTER",
    ...overrides,
  });

const notFound = { ok: false, status: 404, reason: "CHAPTER_NOT_FOUND" };
const notEnrolled = { ok: false, status: 403, reason: "NOT_ENROLLED" };
const quizNeedsSubmission = { ok: false, status: 409, reason: "QUIZ_CHAPTER_REQUIRES_SUBMISSION" };

describe("decideChapterWrite", () => {
  describe("rule 1: the chapter must exist in the expected course", () => {
    it("rejects a missing chapter", () => {
      expect(decide({ chapter: null, isAdmin: true })).toEqual(notFound);
    });

    it("rejects a chapter from another course, even for an admin", () => {
      expect(decide({ expectedCourseId: "course-2", isAdmin: true })).toEqual(notFound);
    });
  });

  describe("rule 2: unpublished chapters exist only for admins", () => {
    it("rejects a student on an unpublished lesson", () => {
      expect(decide({ chapter: chapter({ isPublished: false }) })).toEqual(notFound);
    });

    it("lets an admin write an unpublished lesson", () => {
      expect(decide({ chapter: chapter({ isPublished: false }), isAdmin: true, hasEnrollment: false })).toEqual({
        ok: true,
      });
    });
  });

  describe("rule 3: quiz chapters complete only through a submission", () => {
    it("rejects completing a quiz chapter, even for an admin", () => {
      expect(decide({ chapter: chapter({ type: "QUIZ" }), isAdmin: true })).toEqual(quizNeedsSubmission);
    });

    it("rejects an enrolled student completing a quiz chapter", () => {
      expect(decide({ chapter: chapter({ type: "QUIZ" }) })).toEqual(quizNeedsSubmission);
    });
  });

  describe("rule 4: only quiz chapters take submissions", () => {
    it("rejects a submission on a lesson chapter", () => {
      expect(decide({ action: "SUBMIT_QUIZ" })).toEqual(notFound);
    });

    it("accepts a submission on a quiz chapter from an enrolled student", () => {
      expect(decide({ action: "SUBMIT_QUIZ", chapter: chapter({ type: "QUIZ" }) })).toEqual({ ok: true });
    });
  });

  describe("rule 5: admin, intro, or enrolled", () => {
    it("lets an enrolled student complete a published lesson in the right course", () => {
      expect(decide()).toEqual({ ok: true });
    });

    it("lets an unenrolled student complete a published intro lesson", () => {
      expect(decide({ chapter: chapter({ isIntro: true }), hasEnrollment: false })).toEqual({ ok: true });
    });

    it("rejects an unenrolled student on a published non-intro lesson", () => {
      expect(decide({ hasEnrollment: false })).toEqual(notEnrolled);
    });

    it("rejects an unenrolled student submitting a quiz", () => {
      expect(decide({ action: "SUBMIT_QUIZ", chapter: chapter({ type: "QUIZ" }), hasEnrollment: false })).toEqual(
        notEnrolled
      );
    });

    it("lets an unenrolled admin complete a lesson", () => {
      expect(decide({ isAdmin: true, hasEnrollment: false })).toEqual({ ok: true });
    });
  });
});
