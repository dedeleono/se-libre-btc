import type { QuizQuestionType } from "@prisma/client";

// 100 means every question was answered correctly. `scoreAttempt` is the only code that produces it.
export const PERFECT_SCORE = 100;

const HIGHEST_IMPERFECT_SCORE = 99.9;

export type ScorableQuestion = {
  id: string;
  type: QuizQuestionType;
  metadata: unknown;
  points: number;
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
  earnedPoints: number;
  totalPoints: number;
  answers: GradedAnswer[];
};

export type QuizGrading =
  | { kind: "SELF_CHECK"; passingScore: 0 }
  | { kind: "GRADED"; passingScore: number }
  | { kind: "FINAL_EXAM"; passingScore: typeof PERFECT_SCORE };

// The final exam always needs 100, whatever passingScore is stored. A non-final quiz at 0 is a self-check.
export function quizGrading(quiz: { isFinalExam: boolean; passingScore: number }): QuizGrading {
  if (quiz.isFinalExam) return { kind: "FINAL_EXAM", passingScore: PERFECT_SCORE };
  return quiz.passingScore > 0
    ? { kind: "GRADED", passingScore: quiz.passingScore }
    : { kind: "SELF_CHECK", passingScore: 0 };
}

export function isPassing(grading: QuizGrading, scorePercent: number): boolean {
  return scorePercent >= grading.passingScore;
}

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
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
  const earnedPoints = questions.reduce((sum, question, index) => sum + (answers[index].isCorrect ? question.points : 0), 0);
  const allCorrect = totalCount > 0 && correctCount === totalCount;

  // Plain rounding turns 2100 of 2101 points (99.95…) into 100. Cap anything short of all-correct at 99.9.
  const scorePercent = allCorrect
    ? PERFECT_SCORE
    : totalPoints > 0
      ? Math.min(HIGHEST_IMPERFECT_SCORE, Math.round((earnedPoints / totalPoints) * 1000) / 10)
      : 0;

  return { scorePercent, correctCount, totalCount, earnedPoints, totalPoints, answers };
}
