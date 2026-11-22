import { describe, expect, it } from "vitest";

import { shouldRevealAnswers, toAnswerKey, toQuizForPlayer } from "./quiz-dto";

type QuizInput = Parameters<typeof toQuizForPlayer>[0];
type QuestionInput = QuizInput["questions"][number];

const question = (overrides: Partial<QuestionInput> & Pick<QuestionInput, "id">): QuestionInput => ({
  prompt: `Prompt ${overrides.id}`,
  type: "MULTIPLE_CHOICE",
  metadata: null,
  options: [],
  ...overrides,
});

const quiz = (questions: QuestionInput[]): QuizInput => ({
  id: "quiz-1",
  title: "Examen final",
  description: "Responde todo",
  allowRetries: true,
  questions,
});

const allowsMultiple = (q: QuestionInput) => toQuizForPlayer(quiz([q])).questions[0].allowsMultiple;

describe("toQuizForPlayer", () => {
  it("leaves the answer key out of the serialized DTO", () => {
    const source = {
      ...quiz([
        question({
          id: "q1",
          metadata: { correctAnswer: "Satoshi", acceptedAnswers: ["Nakamoto"], multipleAnswers: true },
          options: [
            { id: "o1", content: "A", isCorrect: true },
            { id: "o2", content: "B", isCorrect: false },
          ],
        }),
      ]),
    };
    const sourceWithExtras = {
      ...source,
      questions: source.questions.map((q) => ({ ...q, explanation: "Because" })),
    };

    const json = JSON.stringify(toQuizForPlayer(sourceWithExtras));

    for (const key of ["isCorrect", "metadata", "correctAnswer", "acceptedAnswers", "explanation"]) {
      expect(json).not.toContain(`"${key}"`);
    }
  });

  it("copies ids, prompt, content, and quiz fields exactly, in order", () => {
    const result = toQuizForPlayer({
      ...quiz([
        question({
          id: "q1",
          prompt: "¿Qué es BTC?",
          options: [
            { id: "o2", content: "Dinero", isCorrect: true },
            { id: "o1", content: "Nada", isCorrect: false },
          ],
        }),
        question({ id: "q2", type: "FILL_IN_THE_BLANK", prompt: "Creador" }),
      ]),
      allowRetries: false,
      description: null,
    });

    expect(result).toEqual({
      id: "quiz-1",
      title: "Examen final",
      description: null,
      allowRetries: false,
      questions: [
        {
          id: "q1",
          prompt: "¿Qué es BTC?",
          type: "MULTIPLE_CHOICE",
          allowsMultiple: false,
          options: [
            { id: "o2", content: "Dinero" },
            { id: "o1", content: "Nada" },
          ],
        },
        { id: "q2", prompt: "Creador", type: "FILL_IN_THE_BLANK", allowsMultiple: false, options: [] },
      ],
    });
  });

  describe("allowsMultiple", () => {
    const options = (correct: number) =>
      ["a", "b", "c"].map((id, index) => ({ id, content: id, isCorrect: index < correct }));

    it("is true for multiple choice with more than one correct option", () => {
      expect(allowsMultiple(question({ id: "q", options: options(2) }))).toBe(true);
    });

    it("is false for multiple choice with one correct option", () => {
      expect(allowsMultiple(question({ id: "q", options: options(1) }))).toBe(false);
    });

    it("follows metadata.multipleAnswers when it is set", () => {
      expect(allowsMultiple(question({ id: "q", metadata: { multipleAnswers: false }, options: options(2) }))).toBe(
        false
      );
      expect(allowsMultiple(question({ id: "q", metadata: { multipleAnswers: true }, options: options(1) }))).toBe(
        true
      );
    });

    it("is false for true/false and fill in the blank", () => {
      expect(allowsMultiple(question({ id: "q", type: "TRUE_FALSE", options: options(2) }))).toBe(false);
      expect(allowsMultiple(question({ id: "q", type: "FILL_IN_THE_BLANK" }))).toBe(false);
    });
  });
});

describe("toAnswerKey", () => {
  it("lists correct option ids, the text answer, and the explanation", () => {
    expect(
      toAnswerKey([
        {
          id: "q1",
          explanation: "Two are right",
          metadata: null,
          options: [
            { id: "a", isCorrect: true },
            { id: "b", isCorrect: false },
            { id: "c", isCorrect: true },
          ],
        },
        { id: "q2", explanation: null, metadata: { correctAnswer: "Satoshi" }, options: [] },
        { id: "q3", explanation: null, metadata: { correctAnswer: 5 }, options: [] },
      ])
    ).toEqual([
      { questionId: "q1", correctOptionIds: ["a", "c"], correctTextAnswer: null, explanation: "Two are right" },
      { questionId: "q2", correctOptionIds: [], correctTextAnswer: "Satoshi", explanation: null },
      { questionId: "q3", correctOptionIds: [], correctTextAnswer: null, explanation: null },
    ]);
  });
});

describe("shouldRevealAnswers", () => {
  it.each([
    { showCorrectAnswers: false, isFinalExam: false, scorePercent: 100, expected: false },
    { showCorrectAnswers: true, isFinalExam: false, scorePercent: 0, expected: true },
    { showCorrectAnswers: true, isFinalExam: true, scorePercent: 99.9, expected: false },
    { showCorrectAnswers: true, isFinalExam: true, scorePercent: 0, expected: false },
    { showCorrectAnswers: true, isFinalExam: true, scorePercent: 100, expected: true },
    { showCorrectAnswers: false, isFinalExam: true, scorePercent: 100, expected: false },
  ])(
    "show=$showCorrectAnswers final=$isFinalExam score=$scorePercent -> $expected",
    ({ expected, ...input }) => {
      expect(shouldRevealAnswers(input)).toBe(expected);
    }
  );
});
