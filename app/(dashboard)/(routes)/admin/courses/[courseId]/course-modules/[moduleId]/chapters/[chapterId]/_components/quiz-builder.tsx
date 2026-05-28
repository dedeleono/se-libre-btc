"use client";

import axios from "axios";
import { Quiz, QuizOption, QuizQuestion, QuizQuestionType } from "@prisma/client";
import { ArrowDown, ArrowUp, Pencil, PlusCircle, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type QuizQuestionWithOptions = QuizQuestion & {
  options: QuizOption[];
};

type QuizWithQuestions = Quiz & {
  questions: QuizQuestionWithOptions[];
};

interface QuizBuilderProps {
  chapterId: string;
  quiz: QuizWithQuestions | null;
}

const defaultOptions = ["", "", "", ""];

export const QuizBuilder = ({ chapterId, quiz }: QuizBuilderProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    title: quiz?.title || "Self-check quiz",
    description: quiz?.description || "",
    passingScore: quiz?.passingScore || 70,
    allowRetries: quiz?.allowRetries ?? true,
    showCorrectAnswers: quiz?.showCorrectAnswers ?? true,
  });
  const [question, setQuestion] = useState({
    prompt: "",
    type: "MULTIPLE_CHOICE" as QuizQuestionType,
    explanation: "",
    points: 1,
    correctAnswer: "",
  });
  const [options, setOptions] = useState(defaultOptions);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const sortedQuestions = useMemo(
    () => [...(quiz?.questions || [])].sort((a, b) => a.position - b.position),
    [quiz?.questions]
  );

  const createQuiz = async () => {
    try {
      setIsSaving(true);
      await axios.post(`/api/chapters/${chapterId}/quiz`, settings);
      toast.success("Quiz created");
      router.refresh();
    } catch {
      toast.error("Could not create quiz");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = async () => {
    if (!quiz) return createQuiz();

    try {
      setIsSaving(true);
      await axios.patch(`/api/quizzes/${quiz.id}`, settings);
      toast.success("Quiz settings saved");
      router.refresh();
    } catch {
      toast.error("Could not save quiz settings");
    } finally {
      setIsSaving(false);
    }
  };

  const saveQuestion = async () => {
    if (!quiz || !question.prompt.trim()) return;

    const payloadOptions =
      question.type === "FILL_IN_THE_BLANK"
        ? []
        : question.type === "TRUE_FALSE"
          ? [
              { content: "True", isCorrect: correctOptionIndex === 0, position: 1 },
              { content: "False", isCorrect: correctOptionIndex === 1, position: 2 },
            ]
          : options
              .map((content, index) => ({
                content: content.trim(),
                isCorrect: correctOptionIndex === index,
                position: index + 1,
              }))
              .filter((option) => option.content);

    try {
      setIsSaving(true);
      const payload = {
        prompt: question.prompt,
        type: question.type,
        explanation: question.explanation || null,
        points: question.points,
        metadata:
          question.type === "FILL_IN_THE_BLANK"
            ? { correctAnswer: question.correctAnswer }
            : undefined,
        options: payloadOptions,
      };

      if (editingQuestionId) {
        await axios.patch(`/api/quizzes/${quiz.id}/questions/${editingQuestionId}`, payload);
      } else {
        await axios.post(`/api/quizzes/${quiz.id}/questions`, payload);
      }

      setQuestion({
        prompt: "",
        type: "MULTIPLE_CHOICE",
        explanation: "",
        points: 1,
        correctAnswer: "",
      });
      setOptions(defaultOptions);
      setCorrectOptionIndex(0);
      setEditingQuestionId(null);
      toast.success(editingQuestionId ? "Question saved" : "Question added");
      router.refresh();
    } catch {
      toast.error("Could not add question");
    } finally {
      setIsSaving(false);
    }
  };

  const editQuestion = (item: QuizQuestionWithOptions) => {
    setEditingQuestionId(item.id);
    setQuestion({
      prompt: item.prompt,
      type: item.type,
      explanation: item.explanation || "",
      points: item.points,
      correctAnswer:
        item.metadata && typeof item.metadata === "object" && "correctAnswer" in item.metadata
          ? String((item.metadata as { correctAnswer?: unknown }).correctAnswer || "")
          : "",
    });

    if (item.type === "FILL_IN_THE_BLANK") {
      setOptions(defaultOptions);
      setCorrectOptionIndex(0);
      return;
    }

    const sortedOptions = [...item.options].sort((a, b) => a.position - b.position);
    setOptions([...sortedOptions.map((option) => option.content), ...defaultOptions].slice(0, 4));
    setCorrectOptionIndex(Math.max(0, sortedOptions.findIndex((option) => option.isCorrect)));
  };

  const deleteQuestion = async (questionId: string) => {
    if (!quiz) return;

    try {
      setIsSaving(true);
      await axios.delete(`/api/quizzes/${quiz.id}/questions/${questionId}`);
      toast.success("Question deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete question");
    } finally {
      setIsSaving(false);
    }
  };

  const reorderQuestion = async (questionId: string, direction: "up" | "down") => {
    if (!quiz) return;

    const currentIndex = sortedQuestions.findIndex((item) => item.id === questionId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedQuestions.length) return;

    const reordered = [...sortedQuestions];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      setIsSaving(true);
      await axios.patch(`/api/quizzes/${quiz.id}/questions/reorder`, {
        list: reordered.map((item, index) => ({ id: item.id, position: index + 1 })),
      });
      router.refresh();
    } catch {
      toast.error("Could not reorder questions");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-md border border-slate-200 bg-slate-100 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-medium">Quiz settings</h3>
            <p className="text-sm text-slate-600">Configure this chapter&apos;s self-check quiz.</p>
          </div>
          <Button onClick={updateSettings} disabled={isSaving}>
            {quiz ? "Save settings" : "Create quiz"}
          </Button>
        </div>
        <div className="mt-4 grid gap-3">
          <Input
            value={settings.title}
            onChange={(event) => setSettings((current) => ({ ...current, title: event.target.value }))}
            placeholder="Quiz title"
            className="bg-white"
          />
          <Textarea
            value={settings.description}
            onChange={(event) => setSettings((current) => ({ ...current, description: event.target.value }))}
            placeholder="Description"
            className="bg-white"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              type="number"
              min={0}
              max={100}
              value={settings.passingScore}
              onChange={(event) => setSettings((current) => ({ ...current, passingScore: Number(event.target.value) }))}
              className="bg-white"
            />
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={settings.allowRetries}
                onCheckedChange={(checked) => setSettings((current) => ({ ...current, allowRetries: checked }))}
              />
              Allow retries
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={settings.showCorrectAnswers}
                onCheckedChange={(checked) => setSettings((current) => ({ ...current, showCorrectAnswers: checked }))}
              />
              Show answers
            </label>
          </div>
        </div>
      </div>

      {quiz && (
        <div className="rounded-md border border-slate-200 bg-slate-100 p-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-slate-600" />
            <h3 className="font-medium">Add question</h3>
          </div>
          <div className="mt-4 grid gap-3">
            <Textarea
              value={question.prompt}
              onChange={(event) => setQuestion((current) => ({ ...current, prompt: event.target.value }))}
              placeholder="Question prompt"
              className="bg-white"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={question.type}
                onChange={(event) =>
                  setQuestion((current) => ({ ...current, type: event.target.value as QuizQuestionType }))
                }
                className="rounded-md border bg-white px-3 py-2 text-sm"
              >
                <option value="MULTIPLE_CHOICE">Multiple choice</option>
                <option value="TRUE_FALSE">True / false</option>
                <option value="FILL_IN_THE_BLANK">Fill in the blank</option>
              </select>
              <Input
                type="number"
                min={1}
                value={question.points}
                onChange={(event) => setQuestion((current) => ({ ...current, points: Number(event.target.value) }))}
                className="bg-white"
                placeholder="Points"
              />
            </div>
            {question.type === "FILL_IN_THE_BLANK" ? (
              <Input
                value={question.correctAnswer}
                onChange={(event) => setQuestion((current) => ({ ...current, correctAnswer: event.target.value }))}
                className="bg-white"
                placeholder="Correct answer"
              />
            ) : question.type === "TRUE_FALSE" ? (
              <div className="flex gap-4 text-sm">
                {["True", "False"].map((label, index) => (
                  <label key={label} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={correctOptionIndex === index}
                      onChange={() => setCorrectOptionIndex(index)}
                    />
                    {label} is correct
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid gap-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={correctOptionIndex === index}
                      onChange={() => setCorrectOptionIndex(index)}
                    />
                    <Input
                      value={option}
                      onChange={(event) => {
                        const next = [...options];
                        next[index] = event.target.value;
                        setOptions(next);
                      }}
                      className="bg-white"
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}
            <Textarea
              value={question.explanation}
              onChange={(event) => setQuestion((current) => ({ ...current, explanation: event.target.value }))}
              placeholder="Explanation shown after attempt"
              className="bg-white"
            />
            <div className="flex gap-2">
              <Button onClick={saveQuestion} disabled={isSaving || !question.prompt.trim()}>
                {editingQuestionId ? "Save question" : "Add question"}
              </Button>
              {editingQuestionId && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingQuestionId(null);
                    setQuestion({
                      prompt: "",
                      type: "MULTIPLE_CHOICE",
                      explanation: "",
                      points: 1,
                      correctAnswer: "",
                    });
                    setOptions(defaultOptions);
                    setCorrectOptionIndex(0);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {quiz && (
        <div className="space-y-3">
          {sortedQuestions.map((item, index) => (
            <div key={item.id} className="rounded-md border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {index + 1}. {item.prompt}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.type.replaceAll("_", " ").toLowerCase()} • {item.points} point{item.points === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" disabled={index === 0 || isSaving} onClick={() => reorderQuestion(item.id, "up")}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={index === sortedQuestions.length - 1 || isSaving} onClick={() => reorderQuestion(item.id, "down")}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={isSaving} onClick={() => editQuestion(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={isSaving} onClick={() => deleteQuestion(item.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {item.options.length > 0 && (
                <div className="mt-3 grid gap-2 text-sm">
                  {item.options.map((option) => (
                    <div key={option.id} className={option.isCorrect ? "font-medium text-emerald-700" : "text-muted-foreground"}>
                      {option.content}
                    </div>
                  ))}
                </div>
              )}
              {item.explanation && <p className="mt-3 text-sm text-muted-foreground">{item.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
