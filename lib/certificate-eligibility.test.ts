import { describe, it, expect } from "vitest";
import { pickFinalQuiz, evaluateEligibility } from "./certificate-eligibility";

const quizChapter = (chapterId: string, quizId: string, title = "Final quiz") => ({
  id: chapterId,
  title,
  quiz: { id: quizId, title },
});

const lessonChapter = (chapterId: string, title = "Lesson") => ({
  id: chapterId,
  title,
  quiz: null,
});

describe("pickFinalQuiz", () => {
  it("returns null when there are no chapters", () => {
    expect(pickFinalQuiz([])).toBeNull();
  });

  it("returns null when no chapter has a quiz", () => {
    expect(pickFinalQuiz([{ chapters: [lessonChapter("c1"), lessonChapter("c2")] }])).toBeNull();
  });

  it("uses the last quiz in (module, chapter) order", () => {
    const finalQuiz = pickFinalQuiz([
      { chapters: [quizChapter("c1", "q1", "Earlier quiz")] },
      { chapters: [lessonChapter("c2"), quizChapter("c3", "q3", "Final quiz")] },
    ]);
    expect(finalQuiz).toEqual({ id: "q3", chapterId: "c3", title: "Final quiz" });
  });

  it("ignores a trailing lesson chapter after the last quiz", () => {
    const finalQuiz = pickFinalQuiz([
      { chapters: [quizChapter("c1", "q1"), lessonChapter("c2", "Wrap up")] },
    ]);
    expect(finalQuiz).toEqual({ id: "q1", chapterId: "c1", title: "Final quiz" });
  });

  it("falls back to the chapter title when the quiz title is empty", () => {
    const finalQuiz = pickFinalQuiz([
      { chapters: [{ id: "c1", title: "Module wrap", quiz: { id: "q1", title: "" } }] },
    ]);
    expect(finalQuiz).toEqual({ id: "q1", chapterId: "c1", title: "Module wrap" });
  });
});

describe("evaluateEligibility", () => {
  it("stays eligible when the course has no final quiz (rule does not apply)", () => {
    expect(evaluateEligibility("course-1", null, null)).toEqual({
      eligible: true,
      reason: "NO_FINAL_QUIZ",
      finalQuiz: null,
      finalQuizHref: null,
      bestFinalQuizScorePercent: null,
    });
  });

  it("is eligible when the best final quiz attempt is 100", () => {
    const finalQuiz = { id: "q1", chapterId: "c1", title: "Final quiz" };
    expect(evaluateEligibility("course-1", finalQuiz, 100)).toMatchObject({
      eligible: true,
      reason: "ELIGIBLE",
      finalQuizHref: "/courses/course-1/chapters/c1",
      bestFinalQuizScorePercent: 100,
    });
  });

  it("is not eligible when the best attempt is below 100", () => {
    const finalQuiz = { id: "q1", chapterId: "c1", title: "Final quiz" };
    expect(evaluateEligibility("course-1", finalQuiz, 90)).toMatchObject({
      eligible: false,
      reason: "FINAL_QUIZ_SCORE_TOO_LOW",
      finalQuizHref: "/courses/course-1/chapters/c1",
      bestFinalQuizScorePercent: 90,
    });
  });

  it("is not eligible when there is no completed attempt", () => {
    const finalQuiz = { id: "q1", chapterId: "c1", title: "Final quiz" };
    expect(evaluateEligibility("course-1", finalQuiz, null)).toMatchObject({
      eligible: false,
      reason: "FINAL_QUIZ_SCORE_TOO_LOW",
      bestFinalQuizScorePercent: null,
    });
  });
});
