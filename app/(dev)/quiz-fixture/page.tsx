import { notFound } from "next/navigation";

import { CertificateLockedCard } from "@/app/(course)/courses/[courseId]/complete/_components/certificate-locked-card";
import { QuizPlayer } from "@/app/(course)/courses/[courseId]/chapters/[chapterId]/_components/quiz-player";
import { QuizBuilder } from "@/app/(dashboard)/(routes)/admin/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/_components/quiz-builder";
import type { QuizForPlayer } from "@/lib/quiz-dto";
import { quizGrading } from "@/lib/quiz-scoring";

// Temporary evidence fixture. Renders the real components with made-up data. Removed before merge.

const questions: QuizForPlayer["questions"] = [
  {
    id: "q1",
    prompt:
      "Cuando una persona guarda sus ahorros en bitcoin y controla sus propias llaves privadas, ¿qué riesgo deja de depender de un banco o de un intermediario financiero?",
    type: "MULTIPLE_CHOICE",
    allowsMultiple: false,
    points: 3,
    options: [
      { id: "q1a", content: "El riesgo de custodia" },
      { id: "q1b", content: "El riesgo de volatilidad" },
      { id: "q1c", content: "El riesgo de perder la frase semilla" },
    ],
  },
  {
    id: "q2",
    prompt: "Bitcoin tiene un límite de 21 millones de unidades.",
    type: "TRUE_FALSE",
    allowsMultiple: false,
    points: 1,
    options: [
      { id: "q2t", content: "Verdadero" },
      { id: "q2f", content: "Falso" },
    ],
  },
  {
    id: "q3",
    prompt: "¿Quién publicó el documento técnico de Bitcoin?",
    type: "FILL_IN_THE_BLANK",
    allowsMultiple: false,
    points: 2,
    options: [],
  },
  {
    id: "q4",
    prompt: "¿Cuáles de estas son buenas prácticas de seguridad?",
    type: "MULTIPLE_CHOICE",
    allowsMultiple: true,
    points: 2,
    options: [
      { id: "q4a", content: "Anotar la frase semilla en papel" },
      { id: "q4b", content: "Compartir la frase semilla por chat" },
      { id: "q4c", content: "Usar una billetera de hardware" },
    ],
  },
];

const playerQuiz = (kind: "self" | "graded" | "final"): QuizForPlayer => ({
  id: `fixture-${kind}`,
  title: kind === "final" ? "Examen final" : "Quiz: custodia y seguridad",
  description: "Responde cada pregunta y envía el quiz al terminar.",
  allowRetries: kind !== "graded",
  showCorrectAnswers: true,
  grading: quizGrading({ isFinalExam: kind === "final", passingScore: kind === "self" ? 0 : 70 }),
  totalPoints: questions.reduce((sum, question) => sum + question.points, 0),
  questions,
});

const now = new Date("2026-11-22T12:00:00Z");
const option = (questionId: string, position: number, content: string, isCorrect: boolean) => ({
  id: `${questionId}-${position}`,
  questionId,
  content,
  isCorrect,
  position,
  createdAt: now,
  updatedAt: now,
});

const builderQuiz = {
  id: "fixture-quiz",
  title: "Examen final",
  description: null,
  passingScore: 70,
  allowRetries: true,
  showCorrectAnswers: true,
  isFinalExam: false,
  chapterId: "fixture",
  createdAt: now,
  updatedAt: now,
  questions: [
    {
      id: "b1",
      quizId: "fixture-quiz",
      position: 1,
      type: "MULTIPLE_CHOICE" as const,
      prompt: "¿Qué controla quien tiene las llaves privadas?",
      explanation: null,
      points: 1,
      metadata: { multipleAnswers: false },
      createdAt: now,
      updatedAt: now,
      options: [option("b1", 1, "Los fondos", true), option("b1", 2, "El precio", false)],
    },
    {
      id: "b2",
      quizId: "fixture-quiz",
      position: 2,
      type: "TRUE_FALSE" as const,
      prompt: "Bitcoin tiene un límite de 21 millones de unidades.",
      explanation: null,
      points: 2,
      metadata: null,
      createdAt: now,
      updatedAt: now,
      options: [option("b2", 1, "True", true), option("b2", 2, "False", false)],
    },
    {
      id: "b3",
      quizId: "fixture-quiz",
      position: 3,
      type: "FILL_IN_THE_BLANK" as const,
      prompt: "¿Quién publicó el documento técnico de Bitcoin?",
      explanation: null,
      points: 5,
      metadata: { correctAnswer: "Satoshi Nakamoto", acceptedAnswers: ["Satoshi"], caseSensitive: false },
      createdAt: now,
      updatedAt: now,
      options: [],
    },
  ],
};

export default async function QuizFixturePage(props: { searchParams: Promise<{ view?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { view = "player-self" } = await props.searchParams;

  const content = (() => {
    switch (view) {
      case "player-self":
        return <QuizPlayer quiz={playerQuiz("self")} courseId="fixture-course" />;
      case "player-graded":
        return <QuizPlayer quiz={playerQuiz("graded")} courseId="fixture-course" />;
      case "player-final":
        return <QuizPlayer quiz={playerQuiz("final")} courseId="fixture-course" />;
      case "builder":
        return <QuizBuilder chapterId="fixture" chapterTitle="Examen final" quiz={builderQuiz} />;
      case "locked":
        return (
          <CertificateLockedCard
            eligibility={{
              eligible: false,
              reason: "FINAL_QUIZ_SCORE_TOO_LOW",
              finalQuiz: { id: "q", chapterId: "c", title: "Examen final" },
              finalQuizHref: "/courses/x/chapters/c",
              bestFinalQuizScorePercent: 87.5,
            }}
          />
        );
      default:
        notFound();
    }
  })();

  return <div className="dl-app mx-auto w-full max-w-5xl p-4">{content}</div>;
}
