import { describe, expect, it } from "vitest";

import { evaluateEligibility } from "./certificate-eligibility";
import { PERFECT_SCORE, shouldRevealAnswers } from "./quiz-dto";
import {
  acceptedTextAnswers,
  isPassing,
  quizGrading,
  scoreAttempt,
  type QuizGrading,
  type ScorableQuestion,
} from "./quiz-scoring";

const choice = (
  id: string,
  options: { id: string; isCorrect: boolean }[],
  type: ScorableQuestion["type"] = "MULTIPLE_CHOICE",
  points = 1
): ScorableQuestion => ({ id, type, metadata: null, points, options });

const fill = (id: string, metadata: unknown, points = 1): ScorableQuestion => ({
  id,
  type: "FILL_IN_THE_BLANK",
  metadata,
  points,
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
      earnedPoints: 1,
      totalPoints: 2,
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
      expect(scoreAttempt([], [])).toEqual({
        scorePercent: 0,
        correctCount: 0,
        totalCount: 0,
        earnedPoints: 0,
        totalPoints: 0,
        answers: [],
      });
    });
  });
});

// A quiz whose questions are worth `weights` points each. `answerOnly` answers question i right when `correct(i)`.
const weightedQuiz = (weights: number[]) =>
  weights.map((points, index) => choice(`q${index}`, [{ id: `q${index}-ok`, isCorrect: true }], "MULTIPLE_CHOICE", points));
const answerOnly = (questions: ScorableQuestion[], correct: (index: number) => boolean) =>
  questions.map((q, index) => pick(q.id, correct(index) ? [`${q.id}-ok`] : ["wrong"]));

describe("weighted score", () => {
  it("weights each question by its points", () => {
    const questions = weightedQuiz([3, 1]);
    expect(scoreAttempt(questions, answerOnly(questions, (i) => i === 0))).toMatchObject({
      scorePercent: 75,
      earnedPoints: 3,
      totalPoints: 4,
      correctCount: 1,
      totalCount: 2,
    });
    expect(scoreAttempt(questions, answerOnly(questions, (i) => i === 1)).scorePercent).toBe(25);
  });

  it("rounds a weighted score to one decimal", () => {
    // Only the 2-point question is right: 2 / 7 = 28.571…, which rounds to 28.6.
    const questions = weightedQuiz([1, 2, 4]);
    expect(scoreAttempt(questions, answerOnly(questions, (i) => i === 1)).scorePercent).toBe(28.6);
  });

  it("never rounds a wrong answer up to 100 (2100 of 2101 points)", () => {
    // 21 questions worth 100 each, all right, plus one question worth 1, wrong: 2100 / 2101 = 99.952…
    const questions = weightedQuiz([...Array<number>(21).fill(100), 1]);
    const scored = scoreAttempt(questions, answerOnly(questions, (i) => i < 21));
    expect(scored).toMatchObject({ scorePercent: 99.9, earnedPoints: 2100, totalPoints: 2101 });
  });

  it("never rounds a wrong answer up to 100 (1999 of 2000 equal questions)", () => {
    // 1999 / 2000 = 99.95, which plain one-decimal rounding turns into 100.
    const questions = weightedQuiz(Array<number>(2000).fill(1));
    const scored = scoreAttempt(questions, answerOnly(questions, (i) => i !== 1234));
    expect(scored).toMatchObject({ scorePercent: 99.9, correctCount: 1999, totalCount: 2000 });
  });

  it.each([[[1]], [[1, 1, 1]], [[5, 1]], [[100, 1, 37]]])("is 100 iff every question is right (weights %j)", (weights) => {
    const questions = weightedQuiz(weights);
    expect(scoreAttempt(questions, answerOnly(questions, () => true)).scorePercent).toBe(PERFECT_SCORE);
    for (const missed of weights.keys()) {
      expect(scoreAttempt(questions, answerOnly(questions, (i) => i !== missed)).scorePercent).toBeLessThan(
        PERFECT_SCORE
      );
    }
  });
});

describe("a near-perfect final exam earns nothing a perfect one does", () => {
  const finalQuiz = { id: "final", chapterId: "final-chapter", title: "Examen final" };
  const nearMisses = {
    "2100 of 2101 points": (() => {
      const questions = weightedQuiz([...Array<number>(21).fill(100), 1]);
      return scoreAttempt(questions, answerOnly(questions, (i) => i < 21));
    })(),
    "1999 of 2000 questions": (() => {
      const questions = weightedQuiz(Array<number>(2000).fill(1));
      return scoreAttempt(questions, answerOnly(questions, (i) => i !== 0));
    })(),
  };

  it.each(Object.entries(nearMisses))("%s keeps the certificate locked", (_, scored) => {
    expect(evaluateEligibility("course", finalQuiz, scored.scorePercent, true)).toMatchObject({
      eligible: false,
      reason: "FINAL_QUIZ_SCORE_TOO_LOW",
    });
  });

  it.each(Object.entries(nearMisses))("%s keeps the final-exam answers hidden", (_, scored) => {
    expect(shouldRevealAnswers({ showCorrectAnswers: true, isFinalExam: true, scorePercent: scored.scorePercent })).toBe(
      false
    );
  });

  it.each(Object.entries(nearMisses))("%s does not pass the final exam", (_, scored) => {
    expect(isPassing(quizGrading({ isFinalExam: true, passingScore: 0 }), scored.scorePercent)).toBe(false);
  });

  it("an all-correct final exam unlocks the certificate", () => {
    const questions = weightedQuiz([...Array<number>(21).fill(100), 1]);
    const scored = scoreAttempt(questions, answerOnly(questions, () => true));
    expect(evaluateEligibility("course", finalQuiz, scored.scorePercent, true).eligible).toBe(true);
  });
});

describe("quizGrading", () => {
  it.each<[{ isFinalExam: boolean; passingScore: number }, QuizGrading]>([
    [{ isFinalExam: true, passingScore: 0 }, { kind: "FINAL_EXAM", passingScore: 100 }],
    [{ isFinalExam: true, passingScore: 70 }, { kind: "FINAL_EXAM", passingScore: 100 }],
    [{ isFinalExam: false, passingScore: 0 }, { kind: "SELF_CHECK", passingScore: 0 }],
    [{ isFinalExam: false, passingScore: 70 }, { kind: "GRADED", passingScore: 70 }],
    [{ isFinalExam: false, passingScore: 100 }, { kind: "GRADED", passingScore: 100 }],
  ])("%j -> %j", (quiz, expected) => {
    expect(quizGrading(quiz)).toEqual(expected);
  });

  it("final-exam threshold is the certificate threshold", () => {
    expect(quizGrading({ isFinalExam: true, passingScore: 0 }).passingScore).toBe(PERFECT_SCORE);
  });
});

describe("isPassing", () => {
  const graded70: QuizGrading = { kind: "GRADED", passingScore: 70 };
  const selfCheck: QuizGrading = { kind: "SELF_CHECK", passingScore: 0 };
  const finalExam: QuizGrading = { kind: "FINAL_EXAM", passingScore: 100 };

  it.each([
    { grading: graded70, scorePercent: 69.9, expected: false },
    { grading: graded70, scorePercent: 70, expected: true },
    { grading: graded70, scorePercent: 100, expected: true },
    { grading: selfCheck, scorePercent: 0, expected: true },
    { grading: finalExam, scorePercent: 99.9, expected: false },
    { grading: finalExam, scorePercent: 100, expected: true },
  ])("$grading.kind at $scorePercent -> $expected", ({ grading, scorePercent, expected }) => {
    expect(isPassing(grading, scorePercent)).toBe(expected);
  });
});
