import type { QuizQuestionType } from "@prisma/client";

export type QuizQuestionForPlayer = {
  id: string;
  prompt: string;
  type: QuizQuestionType;
  allowsMultiple: boolean;
  options: { id: string; content: string }[];
};

export type QuizForPlayer = {
  id: string;
  title: string;
  description: string | null;
  allowRetries: boolean;
  questions: QuizQuestionForPlayer[];
};

export type QuizAnswerKey = {
  questionId: string;
  correctOptionIds: string[];
  correctTextAnswer: string | null;
  explanation: string | null;
};

type QuestionSource = {
  id: string;
  prompt: string;
  type: QuizQuestionType;
  metadata: unknown;
  options: { id: string; content: string; isCorrect: boolean }[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function allowsMultiple(question: QuestionSource): boolean {
  if (question.type !== "MULTIPLE_CHOICE") return false;
  if (isRecord(question.metadata) && "multipleAnswers" in question.metadata) {
    return question.metadata.multipleAnswers === true;
  }
  return question.options.filter((option) => option.isCorrect).length > 1;
}

export function toQuizForPlayer(quiz: {
  id: string;
  title: string;
  description: string | null;
  allowRetries: boolean;
  questions: QuestionSource[];
}): QuizForPlayer {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    allowRetries: quiz.allowRetries,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      type: question.type,
      allowsMultiple: allowsMultiple(question),
      options: question.options.map((option) => ({ id: option.id, content: option.content })),
    })),
  };
}

export function toAnswerKey(
  questions: {
    id: string;
    explanation: string | null;
    metadata: unknown;
    options: { id: string; isCorrect: boolean }[];
  }[]
): QuizAnswerKey[] {
  return questions.map((question) => ({
    questionId: question.id,
    correctOptionIds: question.options.filter((option) => option.isCorrect).map((option) => option.id),
    correctTextAnswer:
      isRecord(question.metadata) && typeof question.metadata.correctAnswer === "string"
        ? question.metadata.correctAnswer
        : null,
    explanation: question.explanation,
  }));
}

export const PERFECT_SCORE = 100;

export function shouldRevealAnswers(input: {
  showCorrectAnswers: boolean;
  isFinalExam: boolean;
  scorePercent: number;
}): boolean {
  return input.showCorrectAnswers && (!input.isFinalExam || input.scorePercent >= PERFECT_SCORE);
}
