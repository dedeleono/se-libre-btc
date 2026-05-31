"use client";

import axios from "axios";
import { Quiz, QuizOption, QuizQuestion, QuizQuestionType } from "@prisma/client";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileQuestion,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ToggleLeft,
  Trash,
  Type,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type QuizQuestionWithOptions = QuizQuestion & {
  options: QuizOption[];
};

type QuizWithQuestions = Quiz & {
  questions: QuizQuestionWithOptions[];
};

type QuestionDraft = {
  prompt: string;
  type: QuizQuestionType;
  explanation: string;
  allowMultipleAnswers: boolean;
  correctAnswer: string;
  acceptedAnswers: string;
  caseSensitive: boolean;
};

interface QuizBuilderProps {
  chapterId: string;
  chapterTitle: string;
  chapterDescription?: string | null;
  quiz: QuizWithQuestions | null;
}

const questionTypes: Array<{
  value: QuizQuestionType;
  label: string;
  description: string;
  icon: typeof Circle;
}> = [
  {
    value: "MULTIPLE_CHOICE",
    label: "Multiple choice",
    description: "Single or multiple answers",
    icon: ClipboardList,
  },
  {
    value: "TRUE_FALSE",
    label: "True / false",
    description: "Binary answer",
    icon: ToggleLeft,
  },
  {
    value: "FILL_IN_THE_BLANK",
    label: "Fill in the blank",
    description: "Typed answer",
    icon: Type,
  },
];

const typeLabels: Record<QuizQuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / false",
  FILL_IN_THE_BLANK: "Fill in the blank",
};

const createDraft = (): QuestionDraft => ({
  prompt: "",
  type: "MULTIPLE_CHOICE",
  explanation: "",
  allowMultipleAnswers: false,
  correctAnswer: "",
  acceptedAnswers: "",
  caseSensitive: false,
});

const createDefaultOptions = () => ["", "", "", ""];

const getTextAnswers = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const getQuestionMetadata = (metadata: unknown) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {
      correctAnswer: "",
      acceptedAnswers: [] as string[],
      caseSensitive: false,
      multipleAnswers: false,
    };
  }

  const value = metadata as {
    correctAnswer?: unknown;
    acceptedAnswers?: unknown;
    caseSensitive?: unknown;
    multipleAnswers?: unknown;
  };

  return {
    correctAnswer: typeof value.correctAnswer === "string" ? value.correctAnswer : "",
    acceptedAnswers: Array.isArray(value.acceptedAnswers)
      ? value.acceptedAnswers.filter((item): item is string => typeof item === "string")
      : [],
    caseSensitive: value.caseSensitive === true,
    multipleAnswers: value.multipleAnswers === true,
  };
};

const uniqueAnswers = (answers: string[], caseSensitive: boolean) => {
  const seen = new Set<string>();
  return answers.filter((answer) => {
    const key = caseSensitive ? answer : answer.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const QuizBuilder = ({
  chapterId,
  chapterTitle,
  chapterDescription,
  quiz,
}: QuizBuilderProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    allowRetries: quiz?.allowRetries ?? true,
    showCorrectAnswers: quiz?.showCorrectAnswers ?? true,
  });
  const [draft, setDraft] = useState<QuestionDraft>(createDraft);
  const [options, setOptions] = useState(createDefaultOptions);
  const [correctOptionIndexes, setCorrectOptionIndexes] = useState<number[]>([0]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const sortedQuestions = useMemo(
    () => [...(quiz?.questions || [])].sort((a, b) => a.position - b.position),
    [quiz?.questions]
  );

  const isEditingQuestion = Boolean(editingQuestionId);

  const resetQuestionForm = () => {
    setDraft(createDraft());
    setOptions(createDefaultOptions());
    setCorrectOptionIndexes([0]);
    setEditingQuestionId(null);
    setFormError(null);
  };

  const ensureQuiz = async () => {
    if (quiz) return quiz.id;

    const response = await axios.post(`/api/chapters/${chapterId}/quiz`, {
      title: chapterTitle,
      description: chapterDescription || null,
      passingScore: 0,
      allowRetries: settings.allowRetries,
      showCorrectAnswers: settings.showCorrectAnswers,
    });

    return response.data.id as string;
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const payload = {
        title: chapterTitle,
        description: chapterDescription || null,
        passingScore: 0,
        allowRetries: settings.allowRetries,
        showCorrectAnswers: settings.showCorrectAnswers,
      };

      if (quiz) {
        await axios.patch(`/api/quizzes/${quiz.id}`, payload);
      } else {
        await axios.post(`/api/chapters/${chapterId}/quiz`, payload);
      }

      toast.success("Self-check settings saved");
      router.refresh();
    } catch {
      toast.error("Could not save self-check settings");
    } finally {
      setIsSaving(false);
    }
  };

  const buildQuestionPayload = () => {
    const prompt = draft.prompt.trim();
    const explanation = draft.explanation.trim();
    const points = 1;

    if (!prompt) {
      return { error: "Add a question prompt before saving." };
    }

    if (draft.type === "FILL_IN_THE_BLANK") {
      const correctAnswer = draft.correctAnswer.trim();
      const acceptedAnswers = uniqueAnswers(
        [correctAnswer, ...getTextAnswers(draft.acceptedAnswers)].filter(Boolean),
        draft.caseSensitive
      );

      if (!correctAnswer) {
        return { error: "Add the correct answer for this fill-in-the-blank question." };
      }

      return {
        payload: {
          prompt,
          type: draft.type,
          explanation: explanation || null,
          points,
          metadata: {
            correctAnswer,
            acceptedAnswers,
            caseSensitive: draft.caseSensitive,
          },
          options: [],
        },
      };
    }

    if (draft.type === "TRUE_FALSE") {
      return {
        payload: {
          prompt,
          type: draft.type,
          explanation: explanation || null,
          points,
          metadata: null,
          options: [
            { content: "True", isCorrect: (correctOptionIndexes[0] ?? 0) === 0, position: 1 },
            { content: "False", isCorrect: (correctOptionIndexes[0] ?? 0) === 1, position: 2 },
          ],
        },
      };
    }

    const cleanedOptions = options
      .map((content, index) => ({ content: content.trim(), sourceIndex: index }))
      .filter((option) => option.content);
    const selectedCorrectIndexes = draft.allowMultipleAnswers
      ? correctOptionIndexes
      : [correctOptionIndexes[0] ?? 0];
    const hasCorrectOption = selectedCorrectIndexes.some((index) => options[index]?.trim());
    const correctOptionCount = selectedCorrectIndexes.filter((index) => options[index]?.trim()).length;

    if (cleanedOptions.length < 2) {
      return { error: "Add at least two answer options." };
    }

    if (!hasCorrectOption) {
      return { error: "Mark at least one answer option that has text." };
    }

    if (draft.allowMultipleAnswers && correctOptionCount < 2) {
      return { error: "Select at least two correct answers for a multiple-answer question." };
    }

    return {
      payload: {
        prompt,
        type: draft.type,
        explanation: explanation || null,
        points,
        metadata: { multipleAnswers: draft.allowMultipleAnswers },
        options: cleanedOptions.map((option, index) => ({
          content: option.content,
          isCorrect: selectedCorrectIndexes.includes(option.sourceIndex),
          position: index + 1,
        })),
      },
    };
  };

  const saveQuestion = async (event?: FormEvent) => {
    event?.preventDefault();

    const result = buildQuestionPayload();
    if ("error" in result) {
      setFormError(result.error || "Review the question details before saving.");
      return;
    }

    try {
      setIsSaving(true);
      const quizId = await ensureQuiz();

      if (editingQuestionId) {
        await axios.patch(`/api/quizzes/${quizId}/questions/${editingQuestionId}`, result.payload);
      } else {
        await axios.post(`/api/quizzes/${quizId}/questions`, result.payload);
      }

      toast.success(editingQuestionId ? "Question saved" : "Question added");
      resetQuestionForm();
      router.refresh();
    } catch (error: any) {
      const message = error?.response?.data?.error || "Could not save question";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const editQuestion = (item: QuizQuestionWithOptions) => {
    const metadata = getQuestionMetadata(item.metadata);
    const sortedOptions = [...item.options].sort((a, b) => a.position - b.position);
    const correctIndex = Math.max(0, sortedOptions.findIndex((option) => option.isCorrect));

    setEditingQuestionId(item.id);
    setDraft({
      prompt: item.prompt,
      type: item.type,
      explanation: item.explanation || "",
      allowMultipleAnswers:
        item.type === "MULTIPLE_CHOICE" &&
        (metadata.multipleAnswers || sortedOptions.filter((option) => option.isCorrect).length > 1),
      correctAnswer: metadata.correctAnswer,
      acceptedAnswers: metadata.acceptedAnswers
        .filter((answer) => answer !== metadata.correctAnswer)
        .join("\n"),
      caseSensitive: metadata.caseSensitive,
    });

    if (item.type === "TRUE_FALSE") {
      setOptions(["True", "False"]);
      setCorrectOptionIndexes([correctIndex]);
    } else if (item.type === "MULTIPLE_CHOICE") {
      setOptions(sortedOptions.length >= 2 ? sortedOptions.map((option) => option.content) : createDefaultOptions());
      const correctIndexes = sortedOptions
        .map((option, index) => (option.isCorrect ? index : -1))
        .filter((index) => index >= 0);
      setCorrectOptionIndexes(correctIndexes.length ? correctIndexes : [0]);
    } else {
      setOptions(createDefaultOptions());
      setCorrectOptionIndexes([0]);
    }

    setFormError(null);
  };

  const deleteQuestion = async (questionId: string) => {
    if (!quiz) return;

    try {
      setIsSaving(true);
      await axios.delete(`/api/quizzes/${quiz.id}/questions/${questionId}`);
      if (editingQuestionId === questionId) {
        resetQuestionForm();
      }
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

  const updateOption = (index: number, value: string) => {
    setOptions((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const removeOption = (index: number) => {
    setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setCorrectOptionIndexes((current) => {
      const next = current
        .filter((item) => item !== index)
        .map((item) => (item > index ? item - 1 : item));

      return next.length ? next : [0];
    });
  };

  const markSingleCorrectOption = (index: number) => {
    setCorrectOptionIndexes([index]);
  };

  const toggleCorrectOption = (index: number) => {
    setCorrectOptionIndexes((current) => {
      if (current.includes(index)) {
        const next = current.filter((item) => item !== index);
        return next.length ? next : [];
      }

      return [...current, index].sort((a, b) => a - b);
    });
  };

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-md border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Self-check behavior</h3>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{sortedQuestions.length} questions</Badge>
              <Badge variant="secondary">Equal weight</Badge>
              <Badge variant={quiz ? "default" : "outline"}>{quiz ? "Configured" : "Draft"}</Badge>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save rules
          </Button>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-2">
          <label className="flex min-h-20 items-center justify-between gap-4 rounded-md border bg-background p-4">
            <div>
              <p className="text-sm font-medium">Allow retries</p>
              <p className="text-xs text-muted-foreground">Learners can repeat the self-check for practice.</p>
            </div>
            <Switch
              checked={settings.allowRetries}
              onCheckedChange={(checked) => setSettings((current) => ({ ...current, allowRetries: checked }))}
            />
          </label>

          <label className="flex min-h-20 items-center justify-between gap-4 rounded-md border bg-background p-4">
            <div>
              <p className="text-sm font-medium">Show answers</p>
              <p className="text-xs text-muted-foreground">Reveal correct answers after submission.</p>
            </div>
            <Switch
              checked={settings.showCorrectAnswers}
              onCheckedChange={(checked) => setSettings((current) => ({ ...current, showCorrectAnswers: checked }))}
            />
          </label>
        </div>
      </div>

      <form onSubmit={saveQuestion} className="rounded-md border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isEditingQuestion ? (
                <Pencil className="h-4 w-4 text-primary" />
              ) : (
                <Plus className="h-4 w-4 text-primary" />
              )}
              <h3 className="font-medium">{isEditingQuestion ? "Edit question" : "Add question"}</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {draft.type === "MULTIPLE_CHOICE" && draft.allowMultipleAnswers
                ? "Multiple answers"
                : typeLabels[draft.type]}
            </p>
          </div>
          {isEditingQuestion && (
            <Button type="button" variant="outline" onClick={resetQuestionForm} disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              Cancel edit
            </Button>
          )}
        </div>

        <div className="space-y-5 p-5">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="questionPrompt">Question prompt</Label>
            <Textarea
              id="questionPrompt"
              value={draft.prompt}
              onChange={(event) => setDraft((current) => ({ ...current, prompt: event.target.value }))}
              placeholder="Write the question students will answer"
              className="min-h-24 resize-y"
            />
          </div>

          <div className="space-y-2">
            <div className="space-y-2">
              <Label>Question type</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {questionTypes.map((item) => {
                  const Icon = item.icon;
                  const isSelected = draft.type === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setDraft((current) => ({
                          ...current,
                          type: item.value,
                          allowMultipleAnswers: item.value === "MULTIPLE_CHOICE" ? current.allowMultipleAnswers : false,
                        }));
                        setCorrectOptionIndexes([0]);
                        setFormError(null);
                      }}
                      className={cn(
                        "flex min-h-20 items-start gap-3 rounded-md border p-3 text-left transition-colors",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "bg-background hover:bg-muted/60"
                      )}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className="block text-xs text-muted-foreground">{item.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {draft.type === "MULTIPLE_CHOICE" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Answer behavior</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft((current) => ({ ...current, allowMultipleAnswers: false }));
                      setCorrectOptionIndexes((current) => [current[0] ?? 0]);
                    }}
                    className={cn(
                      "rounded-md border p-3 text-left transition-colors",
                      !draft.allowMultipleAnswers
                        ? "border-primary bg-primary/10 text-primary"
                        : "bg-background hover:bg-muted/60"
                    )}
                  >
                    <span className="block text-sm font-medium">Single answer</span>
                    <span className="block text-xs text-muted-foreground">Learners see radio buttons.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, allowMultipleAnswers: true }))}
                    className={cn(
                      "rounded-md border p-3 text-left transition-colors",
                      draft.allowMultipleAnswers
                        ? "border-primary bg-primary/10 text-primary"
                        : "bg-background hover:bg-muted/60"
                    )}
                  >
                    <span className="block text-sm font-medium">Multiple answers</span>
                    <span className="block text-xs text-muted-foreground">Learners see checkboxes.</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Label>Answer options</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOptions((current) => [...current, ""])}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add option
                </Button>
              </div>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="grid grid-cols-[32px_1fr_auto] items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        draft.allowMultipleAnswers ? toggleCorrectOption(index) : markSingleCorrectOption(index)
                      }
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                        correctOptionIndexes.includes(index)
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "bg-background text-muted-foreground"
                      )}
                      aria-label={`Mark option ${index + 1} as correct`}
                    >
                      {correctOptionIndexes.includes(index) ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <Input
                      value={option}
                      onChange={(event) => updateOption(index, event.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={options.length <= 2}
                      onClick={() => removeOption(index)}
                      aria-label={`Remove option ${index + 1}`}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {draft.type === "TRUE_FALSE" && (
            <div className="space-y-2">
              <Label>Correct answer</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {["True", "False"].map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => markSingleCorrectOption(index)}
                    className={cn(
                      "flex min-h-14 items-center justify-between rounded-md border p-4 text-sm transition-colors",
                      correctOptionIndexes.includes(index)
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30"
                        : "bg-background hover:bg-muted/60"
                    )}
                  >
                    <span className="font-medium">{label}</span>
                    {correctOptionIndexes.includes(index) && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {draft.type === "FILL_IN_THE_BLANK" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="correctAnswer">Correct answer</Label>
                <Input
                  id="correctAnswer"
                  value={draft.correctAnswer}
                  onChange={(event) => setDraft((current) => ({ ...current, correctAnswer: event.target.value }))}
                  placeholder="Exact expected answer"
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={draft.caseSensitive}
                    onCheckedChange={(checked) =>
                      setDraft((current) => ({ ...current, caseSensitive: checked === true }))
                    }
                  />
                  Case-sensitive matching
                </label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="acceptedAnswers">Accepted alternatives</Label>
                <Textarea
                  id="acceptedAnswers"
                  value={draft.acceptedAnswers}
                  onChange={(event) => setDraft((current) => ({ ...current, acceptedAnswers: event.target.value }))}
                  placeholder="One accepted answer per line"
                  className="min-h-24"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="questionExplanation">Explanation</Label>
            <Textarea
              id="questionExplanation"
              value={draft.explanation}
              onChange={(event) => setDraft((current) => ({ ...current, explanation: event.target.value }))}
              placeholder="Optional feedback shown after the attempt"
              className="min-h-20"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
            <Button type="button" variant="ghost" onClick={resetQuestionForm} disabled={isSaving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isEditingQuestion ? "Save question" : "Add question"}
            </Button>
          </div>
        </div>
      </form>

      <div className="rounded-md border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="font-medium">Question bank</h3>
            <p className="text-xs text-muted-foreground">
              {sortedQuestions.length
                ? `${sortedQuestions.length} saved question${sortedQuestions.length === 1 ? "" : "s"}`
                : "No questions added yet"}
            </p>
          </div>
        </div>

        {sortedQuestions.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="rounded-full bg-muted p-3">
              <FileQuestion className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Start with the first question</p>
              <p className="text-xs text-muted-foreground">Saved questions appear here for review and ordering.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {sortedQuestions.map((item, index) => {
              const metadata = getQuestionMetadata(item.metadata);
              const acceptedAnswers = uniqueAnswers(
                [metadata.correctAnswer, ...metadata.acceptedAnswers].filter(Boolean),
                metadata.caseSensitive
              );

              return (
                <article key={item.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{typeLabels[item.type]}</Badge>
                            {item.type === "MULTIPLE_CHOICE" && (
                              <Badge variant="secondary">
                                {metadata.multipleAnswers ||
                                item.options.filter((option) => option.isCorrect).length > 1
                                  ? "Multiple answers"
                                  : "Single answer"}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6">{item.prompt}</p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={index === 0 || isSaving}
                            onClick={() => reorderQuestion(item.id, "up")}
                            aria-label="Move question up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={index === sortedQuestions.length - 1 || isSaving}
                            onClick={() => reorderQuestion(item.id, "down")}
                            aria-label="Move question down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSaving}
                            onClick={() => editQuestion(item)}
                            aria-label="Edit question"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSaving}
                            onClick={() => deleteQuestion(item.id)}
                            aria-label="Delete question"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {item.type === "FILL_IN_THE_BLANK" ? (
                        <div className="flex flex-wrap gap-2">
                          {acceptedAnswers.map((answer) => (
                            <Badge key={answer} className="bg-emerald-600 hover:bg-emerald-600">
                              {answer}
                            </Badge>
                          ))}
                          {metadata.caseSensitive && <Badge variant="outline">Case-sensitive</Badge>}
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {[...item.options]
                            .sort((a, b) => a.position - b.position)
                            .map((option) => (
                              <div
                                key={option.id}
                                className={cn(
                                  "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
                                  option.isCorrect
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30"
                                    : "bg-background text-muted-foreground"
                                )}
                              >
                                {option.isCorrect ? (
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                                ) : (
                                  <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                )}
                                <span className="min-w-0 whitespace-pre-wrap">{option.content}</span>
                              </div>
                            ))}
                        </div>
                      )}

                      {item.explanation && (
                        <>
                          <Separator />
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.explanation}</p>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
