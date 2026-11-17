import { describe, expect, it } from "vitest";

import { acceptedTextAnswers, scoreAttempt, type ScorableQuestion } from "./quiz-scoring";

const choice = (
  id: string,
  options: { id: string; isCorrect: boolean }[],
  type: ScorableQuestion["type"] = "MULTIPLE_CHOICE"
): ScorableQuestion => ({ id, type, metadata: null, options });

const fill = (id: string, metadata: unknown): ScorableQuestion => ({
  id,
  type: "FILL_IN_THE_BLANK",
  metadata,
  options: [],
});

const pick = (questionId: string, selectedOptionIds: string[]) => ({
  questionId,
  selectedOptionIds,
  textAnswer: null,
});

const type = (questionId: string, textAnswer: string | null) => ({
  questionId,
  selectedOptionIds: [],
  textAnswer,
});

const isCorrect = (question: ScorableQuestion, answer: Parameters<typeof scoreAttempt>[1][number]) =>
  scoreAttempt([question], [answer]).answers[0].isCorrect;

describe("acceptedTextAnswers", () => {
  it("lists correctAnswer first, then string acceptedAnswers", () => {
    expect(
      acceptedTextAnswers({ correctAnswer: "Satoshi", acceptedAnswers: ["Satoshi Nakamoto", 7, null] })
    ).toEqual({ answers: ["Satoshi", "Satoshi Nakamoto"], caseSensitive: false });
  });

  it("drops a non-string or empty correctAnswer and reads caseSensitive only when true", () => {
    expect(acceptedTextAnswers({ correctAnswer: 5, caseSensitive: "yes" })).toEqual({
      answers: [],
      caseSensitive: false,
    });
    expect(acceptedTextAnswers({ correctAnswer: "", caseSensitive: true })).toEqual({
      answers: [],
      caseSensitive: true,
    });
  });

  it("returns no answers for null, arrays, and primitives", () => {
    const none = { answers: [], caseSensitive: false };
    expect(acceptedTextAnswers(null)).toEqual(none);
    expect(acceptedTextAnswers(["Satoshi"])).toEqual(none);
    expect(acceptedTextAnswers("Satoshi")).toEqual(none);
  });
});

describe("scoreAttempt", () => {
  it("single-answer multiple choice is correct only for the exact correct option", () => {
    const q = choice("q", [
      { id: "a", isCorrect: true },
      { id: "b", isCorrect: false },
    ]);
    expect(isCorrect(q, pick("q", ["a"]))).toBe(true);
    expect(isCorrect(q, pick("q", ["b"]))).toBe(false);
    expect(isCorrect(q, pick("q", []))).toBe(false);
    expect(isCorrect(q, pick("q", ["a", "b"]))).toBe(false);
  });

  it("multi-answer multiple choice needs exactly the correct set, in any order", () => {
    const q = choice("q", [
      { id: "a", isCorrect: false },
      { id: "b", isCorrect: true },
      { id: "c", isCorrect: true },
    ]);
    expect(isCorrect(q, pick("q", ["c", "b"]))).toBe(true);
    expect(isCorrect(q, pick("q", ["b"]))).toBe(false);
    expect(isCorrect(q, pick("q", ["a", "b", "c"]))).toBe(false);
    expect(isCorrect(q, pick("q", ["b", "b"]))).toBe(false);
  });

  it("true/false behaves like single choice", () => {
    const q = choice(
      "q",
      [
        { id: "t", isCorrect: true },
        { id: "f", isCorrect: false },
      ],
      "TRUE_FALSE"
    );
    expect(isCorrect(q, pick("q", ["t"]))).toBe(true);
    expect(isCorrect(q, pick("q", ["f"]))).toBe(false);
  });

  it("a choice question with no correct option is always wrong", () => {
    const q = choice("q", [
      { id: "a", isCorrect: false },
      { id: "b", isCorrect: false },
    ]);
    expect(isCorrect(q, pick("q", []))).toBe(false);
    expect(isCorrect(q, pick("q", ["a"]))).toBe(false);
  });

  it("fill in the blank trims, ignores case, and accepts acceptedAnswers", () => {
    const q = fill("q", { correctAnswer: "Satoshi", acceptedAnswers: ["Satoshi Nakamoto"] });
    expect(isCorrect(q, type("q", "  satoshi "))).toBe(true);
    expect(isCorrect(q, type("q", "Satoshi Nakamoto"))).toBe(true);
    expect(isCorrect(q, type("q", "Nakamoto"))).toBe(false);
    expect(isCorrect(q, type("q", ""))).toBe(false);
    expect(isCorrect(q, type("q", "   "))).toBe(false);
    expect(isCorrect(q, type("q", null))).toBe(false);
  });

  it("fill in the blank honors caseSensitive", () => {
    const q = fill("q", { correctAnswer: "BTC", caseSensitive: true });
    expect(isCorrect(q, type("q", "btc"))).toBe(false);
    expect(isCorrect(q, type("q", "BTC"))).toBe(true);
  });

  it("fill in the blank with no metadata is always wrong", () => {
    const q = fill("q", null);
    expect(isCorrect(q, type("q", "anything"))).toBe(false);
    expect(isCorrect(q, type("q", ""))).toBe(false);
  });

  it("an unanswered question is wrong and recorded with an empty answer", () => {
    const q1 = choice("q1", [{ id: "a", isCorrect: true }]);
    const q2 = choice("q2", [{ id: "b", isCorrect: true }]);
    expect(scoreAttempt([q1, q2], [pick("q1", ["a"])])).toEqual({
      scorePercent: 50,
      correctCount: 1,
      totalCount: 2,
      answers: [
        { questionId: "q1", selectedOptionIds: ["a"], textAnswer: null, isCorrect: true },
        { questionId: "q2", selectedOptionIds: [], textAnswer: null, isCorrect: false },
      ],
    });
  });

  it("uses the first submitted answer for a question and returns answers in question order", () => {
    const q1 = choice("q1", [{ id: "a", isCorrect: true }]);
    const q2 = choice("q2", [{ id: "b", isCorrect: true }]);
    const result = scoreAttempt([q1, q2], [pick("q2", ["b"]), pick("q1", ["x"]), pick("q1", ["a"])]);
    expect(result.answers.map((a) => [a.questionId, a.selectedOptionIds, a.isCorrect])).toEqual([
      ["q1", ["x"], false],
      ["q2", ["b"], true],
    ]);
  });

  describe("score", () => {
    const questions = ["q1", "q2", "q3"].map((id) => choice(id, [{ id: `${id}-ok`, isCorrect: true }]));
    const answerFirst = (n: number) => questions.slice(0, n).map((q) => pick(q.id, [`${q.id}-ok`]));

    it("rounds to one decimal", () => {
      expect(scoreAttempt(questions, answerFirst(2)).scorePercent).toBe(66.7);
      expect(scoreAttempt(questions, answerFirst(1)).scorePercent).toBe(33.3);
    });

    it("is 100 only when every question is correct", () => {
      expect(scoreAttempt(questions, answerFirst(3)).scorePercent).toBe(100);
      expect(scoreAttempt(questions.slice(0, 2), answerFirst(2)).scorePercent).toBe(100);
      expect(scoreAttempt(questions.slice(0, 2), answerFirst(1)).scorePercent).toBe(50);
    });

    it("is 0 for a quiz with no questions", () => {
      expect(scoreAttempt([], [])).toEqual({ scorePercent: 0, correctCount: 0, totalCount: 0, answers: [] });
    });
  });
});
