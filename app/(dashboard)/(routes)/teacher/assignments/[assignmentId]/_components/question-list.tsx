"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, GripVertical, ClipboardList, FileText, Star, ArrowRightLeft, AlignJustify } from "lucide-react";
import { QuestionForm } from "./question-form";
import { Assignment, Question, QuestionOption, QuestionType } from "@prisma/client";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { QuestionActions } from "./question-actions";
import axios from "axios";
import { toast } from "sonner";
import { FaQuestionCircle } from "react-icons/fa";
import { TruncatedPreview } from "@/components/truncated-preview";
import { QuestionResponse } from "@/types/assignments";

// Type for questions in the component state
interface QuestionWithEditing extends Omit<QuestionResponse, 'correctOption'> {
  isEditing: boolean;
  correctOption: string | null;
  matchingConfig?: {
    id: string;
    scoringPolicy: string;
    allowReuse: boolean;
    shuffleChoices: boolean;
  };
  matchingPrompts?: {
    id: string;
    content: string;
    position: number;
  }[];
  matchingChoices?: {
    id: string;
    content: string;
    position: number;
  }[];
  matchingPairs?: {
    id: string;
    promptId: string;
    choiceId: string;
  }[];
}

interface QuestionListProps {
  assignmentId: string;
  isQuiz: boolean;
  initialQuestions?: QuestionResponse[];
  assignment: Assignment;
}

// Type for the question form ref
interface QuestionFormRef {
  open: () => void;
  close: () => void;
}

export const QuestionList = ({
  assignmentId,
  isQuiz,
  initialQuestions = [],
  assignment,
}: QuestionListProps) => {
  const questionFormRef = useRef<QuestionFormRef>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [questions, setQuestions] = useState<QuestionWithEditing[]>(
    initialQuestions.map((q) => ({
      ...q,
      correctOption: q.correctOption || null,
      isEditing: false,
    }))
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const isFileSubmission = !assignment.isOnline;

  const onAdd = () => {
    if (isFileSubmission) {
      toast.error("No se pueden agregar preguntas cuando el envío de archivos está habilitado");
      return;
    }
    setIsCreating(true);
    questionFormRef.current?.open();
  };

  const onEdit = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        isEditing: q.id === id,
      }))
    );
  };

  const onReorder = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions) as QuestionWithEditing[];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Create a new array with the minimal data needed for reordering
    const updatedQuestions = items.map((item, index) => ({
      id: item.id,
      position: index + 1,
    }));

    // Update the state with the full question objects
    setQuestions(
      items.map((item: QuestionWithEditing) => ({
        ...item,
        position: items.indexOf(item) + 1,
      }))
    );

    setIsUpdating(true);

    try {
      await axios.put(`/api/assignments/${assignmentId}/questions/reorder`, {
        questions: updatedQuestions,
      });
      toast.success("Preguntas reordenadas exitosamente");
    } catch (error) {
      toast.error("Error al reordenar preguntas");
      // Revert the state if the API call fails
      setQuestions(questions);
    } finally {
      setIsUpdating(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      setIsUpdating(true);
      await axios.delete(`/api/assignments/${assignmentId}/questions/${id}`);
      setQuestions((prev) =>
        prev
          .filter((q) => q.id !== id)
          .map((q) => ({
            ...q,
            options: q.options,
            isEditing: q.isEditing || false,
          }))
      );
      toast.success("Pregunta eliminada");
    } catch {
      toast.error("Error al eliminar pregunta");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-x-2">
          <FaQuestionCircle className="h-6 w-6 text-sky-700 border-none" />
          <h2 className="text-xl font-semibold">Preguntas</h2>
        </div>
        <Button
          onClick={onAdd}
          variant="ghost"
          className="gap-1"
          disabled={isFileSubmission}
        >
          <PlusCircle className="h-4 w-4" />
          Agregar pregunta
        </Button>
      </div>

      {isFileSubmission && (
        <div className="mb-4 p-4 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
          <p className="text-sm">
            Las preguntas no se pueden agregar cuando el envío de archivos está
            habilitado. Cambia al modo de envío en línea para gestionar las
            preguntas.
          </p>
        </div>
      )}

      {isCreating && (
        <QuestionForm
          ref={questionFormRef}
          assignmentId={assignmentId}
          isQuiz={isQuiz}
          onSuccess={(question: QuestionResponse) => {
            console.log("Question created:", question);
            setQuestions((prev) => [
              ...prev,
              {
                ...question,
                isEditing: false,
                options: question.options,
                correctOption: question.correctOption || null,
                matchingConfig: question.matchingConfig,
                matchingPrompts: question.matchingPrompts,
                matchingChoices: question.matchingChoices,
                matchingPairs: question.matchingPairs,
              },
            ]);
            setIsCreating(false);
            questionFormRef.current?.close();
          }}
          onClose={() => {
            setIsCreating(false);
            questionFormRef.current?.close();
          }}
        />
      )}

      <DragDropContext onDragEnd={onReorder}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={cn(
                "relative",
                isFileSubmission && "opacity-50 pointer-events-none"
              )}
            >
              {isUpdating && (
                <div className="absolute h-full w-full bg-slate-500/20 top-0 right-0 rounded-md flex items-center justify-center z-10">
                  <Loader2 className="h-6 w-6 text-sky-700 animate-spin" />
                </div>
              )}

              {questions.length === 0 && !isFileSubmission && (
                <div className="text-center text-sm text-muted-foreground mt-4 p-4 border border-dashed rounded-md">
                  No se han agregado preguntas todavía. Haz clic en
                  &quot;Agregar pregunta&quot; para comenzar.
                </div>
              )}

              {questions.map((question, index) => (
                <Draggable
                  key={question.id}
                  draggableId={question.id}
                  index={index}
                >
                  {(provided) => (
                    <div
                      className={cn(
                        "flex items-center gap-x-2 bg-slate-100 border-slate-200 border rounded-md mb-4 text-slate-700 text-sm",
                        question.isEditing && "bg-slate-200"
                      )}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <div
                        className="px-2 py-3 border-r border-r-slate-200 rounded-l-md transition"
                        {...provided.dragHandleProps}
                      >
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="flex-1 p-3">
                        {question.isEditing ? (
                          <QuestionForm
                            key={`edit-${question.id}`}
                            assignmentId={assignmentId}
                            isQuiz={isQuiz}
                            initialData={question}
                            onClose={() => {
                              setQuestions((prev) =>
                                prev.map((q) => ({
                                  ...q,
                                  isEditing: false,
                                }))
                              );
                            }}
                            onSuccess={(updatedQuestion: QuestionResponse) => {
                              console.log("Question updated:", updatedQuestion);
                              setQuestions((prev) =>
                                prev.map((q) =>
                                  q.id === updatedQuestion.id
                                    ? {
                                        ...updatedQuestion,
                                        isEditing: false,
                                        options: updatedQuestion.options,
                                        correctOption: updatedQuestion.correctOption || null,
                                        matchingConfig: updatedQuestion.matchingConfig,
                                        matchingPrompts: updatedQuestion.matchingPrompts,
                                        matchingChoices: updatedQuestion.matchingChoices,
                                        matchingPairs: updatedQuestion.matchingPairs,
                                      }
                                    : q
                                )
                              );
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="max-w-[500px] overflow-hidden">
                              {question.type === QuestionType.MATCHING ? (
                                <div className="text-sm font-medium">
                                  Pregunta de Relacionar ({question.matchingPrompts?.length || 0} elementos)
                                </div>
                              ) : (
                                <TruncatedPreview value={question.content} />
                              )}
                            </div>
                            <div className="flex items-center gap-x-3 ml-4">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-full px-3 py-1 font-light text-xs text-nowrap",
                                  question.type === QuestionType.MULTIPLE_CHOICE
                                    ? "bg-orange-500 border-orange-500"
                                    : question.type === QuestionType.MATCHING
                                    ? "bg-blue-500 border-blue-500"
                                    : question.type === QuestionType.FILL_IN_THE_BLANK
                                    ? "bg-green-500 border-green-500"
                                    : "bg-violet-600/10 border-violet-600"
                                )}
                              >
                                <div className="flex items-center gap-x-1">
                                  {question.type === QuestionType.MULTIPLE_CHOICE ? (
                                    <>
                                      <ClipboardList className="h-3 w-3" />
                                      <span>Selección múltiple</span>
                                    </>
                                  ) : question.type === QuestionType.MATCHING ? (
                                    <>
                                      <ArrowRightLeft className="h-3 w-3" />
                                      <span>Relacionar</span>
                                    </>
                                  ) : question.type === QuestionType.FILL_IN_THE_BLANK ? (
                                    <>
                                      <AlignJustify className="h-3 w-3" />
                                      <span>Completar Espacios</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="h-3 w-3" />
                                      <span>Respuesta abierta</span>
                                    </>
                                  )}
                                </div>
                              </Badge>

                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-full px-3 py-1 bg-indigo-600/10 border-indigo-600 text-nowrap font-semibold text-xs",
                                  "flex items-center gap-x-1"
                                )}
                              >
                                <Star className="h-3 w-3" />
                                <span>
                                  {question.points}{" "}
                                  {question.points === 1 ? "punto" : "puntos"}
                                </span>
                              </Badge>

                              <div className="">
                                <QuestionActions
                                  onEdit={() => onEdit(question.id)}
                                  onDelete={() => onDelete(question.id)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
