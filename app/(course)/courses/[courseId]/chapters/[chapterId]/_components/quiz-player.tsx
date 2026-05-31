"use client";

import axios from "axios";
import { Quiz, QuizOption, QuizQuestion } from "@prisma/client";
import { CheckCircle, ChevronRight, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type QuizQuestionWithOptions = QuizQuestion & {
  options: QuizOption[];
};

type QuizWithQuestions = Quiz & {
  questions: QuizQuestionWithOptions[];
};

type ResultQuestion = QuizQuestionWithOptions;

interface QuizPlayerProps {
  quiz: QuizWithQuestions;
  courseId: string;
  nextChapterId?: string;
}

const getCorrectTextAnswer = (metadata: unknown) => {
  if (metadata && typeof metadata === "object" && "correctAnswer" in metadata) {
    const correctAnswer = (metadata as { correctAnswer?: unknown }).correctAnswer;
    return typeof correctAnswer === "string" ? correctAnswer : null;
  }
  return null;
};

export const QuizPlayer = ({ quiz, courseId, nextChapterId }: QuizPlayerProps) => {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    scorePercent: number;
    showCorrectAnswers: boolean;
    questions: ResultQuestion[];
  } | null>(null);

  const toggleOption = (questionId: string, optionId: string, single = false) => {
    setSelectedOptions((current) => {
      if (single) {
        return { ...current, [questionId]: [optionId] };
      }
      const currentIds = current[questionId] || [];
      const nextIds = currentIds.includes(optionId)
        ? currentIds.filter((id) => id !== optionId)
        : [...currentIds, optionId];
      return { ...current, [questionId]: nextIds };
    });
  };

  const submitQuiz = async () => {
    try {
      setIsSubmitting(true);
      const response = await axios.post(`/api/quizzes/${quiz.id}/submit`, {
        answers: quiz.questions.map((question) => ({
          questionId: question.id,
          selectedOptionIds: selectedOptions[question.id] || [],
          textAnswer: textAnswers[question.id] || null,
        })),
      });
      setResult(response.data);
      toast.success("Quiz submitted");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data || "Could not submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  const retry = () => {
    setSelectedOptions({});
    setTextAnswers({});
    setResult(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        {quiz.description && <p className="mt-2 text-muted-foreground">{quiz.description}</p>}
        <p className="mt-2 text-sm text-muted-foreground">
          This is a self-check. It saves your progress and gives lightweight feedback.
        </p>
      </div>

      {result && (
        <div className="rounded-md border bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <p className="font-medium">
              Self-check complete · {result.scorePercent}% correct
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your course progress has been saved. This result is for feedback only.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {quiz.questions.map((question, index) => {
          const showAnswers = result?.showCorrectAnswers;
          const resultQuestion = result?.questions.find((item) => item.id === question.id);
          const isSingleChoice = question.type === "TRUE_FALSE";

          return (
            <div key={question.id} className="rounded-md border bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {index + 1}. {question.prompt}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{question.points} point{question.points === 1 ? "" : "s"}</p>
                </div>
              </div>

              {question.type === "FILL_IN_THE_BLANK" ? (
                <Input
                  value={textAnswers[question.id] || ""}
                  onChange={(event) => setTextAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                  disabled={!!result}
                  className="mt-3"
                  placeholder="Your answer"
                />
              ) : (
                <div className="mt-3 space-y-2">
                  {question.options.map((option) => {
                    const checked = (selectedOptions[question.id] || []).includes(option.id);
                    return (
                      <label key={option.id} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                        <input
                          type={isSingleChoice ? "radio" : "checkbox"}
                          name={question.id}
                          checked={checked}
                          disabled={!!result}
                          onChange={() => toggleOption(question.id, option.id, isSingleChoice)}
                        />
                        <span>{option.content}</span>
                        {showAnswers && resultQuestion?.options.find((item) => item.id === option.id)?.isCorrect && (
                          <span className="ml-auto text-xs font-medium text-emerald-700">Correct</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {showAnswers && question.type === "FILL_IN_THE_BLANK" && (
                <p className="mt-3 text-sm text-emerald-700">
                  Correct answer: {getCorrectTextAnswer(resultQuestion?.metadata)}
                </p>
              )}
              {showAnswers && resultQuestion?.explanation && (
                <p className="mt-3 text-sm text-muted-foreground">{resultQuestion.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!result && (
          <Button onClick={submitQuiz} disabled={isSubmitting || quiz.questions.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit quiz
          </Button>
        )}
        {result && quiz.allowRetries && (
          <Button variant="outline" onClick={retry}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
        {result && nextChapterId && (
          <Button onClick={() => router.push(`/courses/${courseId}/chapters/${nextChapterId}`)}>
            Next chapter
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
