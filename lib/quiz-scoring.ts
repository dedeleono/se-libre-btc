import type { QuizQuestionType } from "@prisma/client";

export type ScorableQuestion = {
  id: string;
  type: QuizQuestionType;
  metadata: unknown;
  options: { id: string; isCorrect: boolean }[];
};

export type SubmittedAnswer = {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
};

export type GradedAnswer = SubmittedAnswer & { isCorrect: boolean };

export type ScoredAttempt = {
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  answers: GradedAnswer[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalize = (value: string, caseSensitive: boolean) => {
  const trimmed = value.trim();
  return caseSensitive ? trimmed : trimmed.toLowerCase();
};

export function acceptedTextAnswers(metadata: unknown): { answers: string[]; caseSensitive: boolean } {
  if (!isRecord(metadata)) return { answers: [], caseSensitive: false };

  const accepted = Array.isArray(metadata.acceptedAnswers)
    ? metadata.acceptedAnswers.filter((item): item is string => typeof item === "string")
    : [];
  const answers = [typeof metadata.correctAnswer === "string" ? metadata.correctAnswer : "", ...accepted].filter(
    Boolean
  );

  return { answers, caseSensitive: metadata.caseSensitive === true };
}

function isAnswerCorrect(question: ScorableQuestion, answer: SubmittedAnswer): boolean {
  if (question.type === "FILL_IN_THE_BLANK") {
    const { answers, caseSensitive } = acceptedTextAnswers(question.metadata);
    const submitted = answer.textAnswer ? normalize(answer.textAnswer, caseSensitive) : "";
    return (
      answers.length > 0 && submitted !== "" && answers.some((accepted) => normalize(accepted, caseSensitive) === submitted)
    );
  }

  const correct = question.options
    .filter((option) => option.isCorrect)
    .map((option) => option.id)
    .sort();
  const selected = [...answer.selectedOptionIds].sort();
  return correct.length > 0 && correct.length === selected.length && correct.every((id, index) => selected[index] === id);
}

export function scoreAttempt(questions: ScorableQuestion[], submitted: SubmittedAnswer[]): ScoredAttempt {
  const answers = questions.map((question): GradedAnswer => {
    const match = submitted.find((answer) => answer.questionId === question.id);
    const answer: SubmittedAnswer = {
      questionId: question.id,
      selectedOptionIds: match?.selectedOptionIds ?? [],
      textAnswer: match?.textAnswer ?? null,
    };
    return { ...answer, isCorrect: isAnswerCorrect(question, answer) };
  });

  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const totalCount = questions.length;

  return {
    scorePercent: Math.round((correctCount / (totalCount || 1)) * 1000) / 10,
    correctCount,
    totalCount,
    answers,
  };
}
