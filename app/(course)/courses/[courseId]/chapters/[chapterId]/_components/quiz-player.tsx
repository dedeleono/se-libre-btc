"use client";

import axios from "axios";
import { CheckCircle, ChevronRight, Loader2, RotateCcw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale, type Messages } from "@/lib/i18n";
import type { QuizForPlayer, QuizSubmitResult } from "@/lib/quiz-dto";

type CourseCopy = Messages["course"];

// One entry per grading kind, so a new kind fails to compile until its copy exists.
function introLines(quiz: QuizForPlayer, t: CourseCopy): string[] {
  const { grading } = quiz;
  const lines = ((): string[] => {
    switch (grading.kind) {
      case "SELF_CHECK":
        return [t.quizSelfCheck];
      case "GRADED":
        return [t.quizGradedIntro(grading.passingScore)];
      case "FINAL_EXAM":
        return quiz.showCorrectAnswers ? [t.quizFinalExamIntro, t.quizAnswersAfterPerfect] : [t.quizFinalExamIntro];
      default: {
        const unreachable: never = grading;
        return unreachable;
      }
    }
  })();
  return quiz.allowRetries ? lines : [...lines, t.quizSingleAttempt];
}

function resultCopy(result: QuizSubmitResult, allowRetries: boolean, t: CourseCopy) {
  const { grading, scorePercent: score } = result;
  const points = t.quizPointsEarned(result.earnedPoints, result.totalPoints);
  const withRetry = (line: string, retry: string) => (allowRetries ? `${line} ${retry}` : line);
  switch (grading.kind) {
    case "SELF_CHECK":
      return { passed: true, heading: t.quizComplete(score), body: [t.quizProgressSaved] };
    case "GRADED":
      return result.passed
        ? { passed: true, heading: t.quizPassed(score), body: [points] }
        : {
            passed: false,
            heading: t.quizNotPassed(score),
            body: [points, withRetry(t.quizPassingScoreNeeded(grading.passingScore), t.quizReviewLessonAndRetry)],
          };
    case "FINAL_EXAM":
      return result.passed
        ? { passed: true, heading: t.quizPassed(score), body: [t.quizFinalExamPassed] }
        : {
            passed: false,
            heading: t.quizNotPassed(score),
            body: [points, withRetry(t.quizFinalExamNeeded, t.quizReviewCourseAndRetry)],
          };
    default: {
      const unreachable: never = grading;
      return unreachable;
    }
  }
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const hasSubmitted = useRef(false);

  // The submit button unmounts with the result, so move focus to what replaced it: the result heading after
  // a submit, the quiz title after a retry.
  useEffect(() => {
    if (!hasSubmitted.current) return;
    const target = result ? resultHeadingRef.current : titleRef.current;
    const frame = requestAnimationFrame(() => {
      target?.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [result]);

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
      const submitted = response.data as QuizSubmitResult;
      hasSubmitted.current = true;
      setResult(submitted);
      toast.success(t.course.quizSubmitted);
      // Finishing a quiz can complete the whole course. Prompt the student to
      // their certificate / Maverick page instead of stranding them here.
      if (submitted.courseCompleted) {
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
    hasSubmitted.current = true;
    setSelectedOptions({});
    setTextAnswers({});
    setResult(null);
  };

  const outcome = result ? resultCopy(result, quiz.allowRetries, t.course) : null;
  const showQuestionPoints = new Set(quiz.questions.map((question) => question.points)).size > 1;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 ref={titleRef} tabIndex={-1} className="scroll-mt-6 text-2xl font-bold text-balance">
          {quiz.title}
        </h1>
        {quiz.description && <p className="mt-2 text-muted-foreground text-pretty">{quiz.description}</p>}
        <p className="mt-2 text-sm text-muted-foreground text-pretty">{introLines(quiz, t.course).join(" ")}</p>
      </div>

      <div role="status" aria-live="polite">
        {outcome && result && (
          <div className="rounded-md border bg-muted p-4">
            <h2
              ref={resultHeadingRef}
              tabIndex={-1}
              className="flex scroll-mt-6 items-center gap-2 font-medium tabular-nums"
            >
              {outcome.passed ? (
                <CheckCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-success" />
              ) : (
                <XCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-destructive" />
              )}
              {outcome.heading}
            </h2>
            {outcome.body.map((line) => (
              <p key={line} className="mt-2 text-sm text-muted-foreground tabular-nums text-pretty">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {quiz.questions.map((question, index) => {
          const showAnswers = result?.showCorrectAnswers;
          const key = result?.answerKey.find((item) => item.questionId === question.id);
          const isSingleChoice = !question.allowsMultiple;

          return (
            <div key={question.id} className="rounded-md border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {index + 1}. {question.prompt}
                  </p>
                  {(question.allowsMultiple || showQuestionPoints) && (
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      {[
                        showQuestionPoints ? t.course.questionPoints(question.points) : null,
                        question.allowsMultiple ? t.course.selectAllThatApply : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
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
