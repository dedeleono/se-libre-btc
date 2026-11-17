"use client";

import axios from "axios";
import { CheckCircle, ChevronRight, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n";
import type { QuizAnswerKey, QuizForPlayer } from "@/lib/quiz-dto";

interface QuizPlayerProps {
  quiz: QuizForPlayer;
  courseId: string;
  nextChapterId?: string;
}

export const QuizPlayer = ({ quiz, courseId, nextChapterId }: QuizPlayerProps) => {
  const { t } = useLocale();
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    scorePercent: number;
    showCorrectAnswers: boolean;
    answerKey: QuizAnswerKey[];
    courseCompleted?: boolean;
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
      toast.success(t.course.quizSubmitted);
      // Finishing a quiz can complete the whole course. Prompt the student to
      // their certificate / Maverick page instead of stranding them here.
      if (response.data?.courseCompleted) {
        router.push(`/courses/${courseId}/complete`);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error?.response?.data || t.course.quizSubmitError);
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
        <h1 className="text-2xl font-bold text-balance">{quiz.title}</h1>
        {quiz.description && <p className="mt-2 text-muted-foreground text-pretty">{quiz.description}</p>}
        <p className="mt-2 text-sm text-muted-foreground">
          {t.course.quizSelfCheck}
        </p>
      </div>

      {result && (
        <div className="rounded-md border bg-muted p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <p className="font-medium tabular-nums">
              {t.course.quizComplete(result.scorePercent)}
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.course.quizProgressSaved}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {quiz.questions.map((question, index) => {
          const showAnswers = result?.showCorrectAnswers;
          const key = result?.answerKey.find((item) => item.questionId === question.id);
          const isSingleChoice = !question.allowsMultiple;

          return (
            <div key={question.id} className="rounded-md border bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {index + 1}. {question.prompt}
                  </p>
                  {question.allowsMultiple && (
                    <p className="mt-1 text-xs text-muted-foreground">{t.course.selectAllThatApply}</p>
                  )}
                </div>
              </div>

              {question.type === "FILL_IN_THE_BLANK" ? (
                <Input
                  value={textAnswers[question.id] || ""}
                  onChange={(event) => setTextAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                  disabled={!!result}
                  className="mt-3"
                  placeholder={t.course.yourAnswer}
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
                        {showAnswers && key?.correctOptionIds.includes(option.id) && (
                          <span className="ml-auto text-xs font-medium text-success">{t.course.correct}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {showAnswers && question.type === "FILL_IN_THE_BLANK" && (
                <p className="mt-3 text-sm text-success">
                  {t.course.correctAnswer(key?.correctTextAnswer ?? null)}
                </p>
              )}
              {showAnswers && key?.explanation && (
                <p className="mt-3 text-sm text-muted-foreground">{key.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!result && (
          <Button onClick={submitQuiz} disabled={isSubmitting || quiz.questions.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.course.submitQuiz}
          </Button>
        )}
        {result && quiz.allowRetries && (
          <Button variant="outline" onClick={retry}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t.course.retryQuiz}
          </Button>
        )}
        {result && nextChapterId && (
          <Button onClick={() => router.push(`/courses/${courseId}/chapters/${nextChapterId}`)}>
            {t.course.nextChapter}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {result?.courseCompleted && (
          <Button onClick={() => router.push(`/courses/${courseId}/complete`)}>
            {t.course.finishCourse}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
