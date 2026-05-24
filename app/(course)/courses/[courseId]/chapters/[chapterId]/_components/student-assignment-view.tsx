"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axios from "axios";
import { S3FileUpload } from "@/components/file-upload";
import { Timer } from "./timer";
import { Step, type StepItem, Stepper, useStepper } from "@/components/stepper";
import { StepperProviderRef } from "@/components/stepper/context";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { X } from "lucide-react";
import { Grip } from "lucide-react";

import {
  Assignment,
  Question,
  QuestionType,
  Submission,
  QuestionOption,
} from "@prisma/client";
import { Preview } from "@/components/preview";

interface QuestionWithOptions extends Question {
  options: QuestionOption[];
  matchingConfig?: {
    id: string;
    questionId: string;
    scoringPolicy: string;
    allowReuse: boolean;
    shuffleChoices: boolean;
  } | null;
  matchingPrompts?: {
    id: string;
    questionId: string;
    content: string;
    position: number;
  }[];
  matchingChoices?: {
    id: string;
    questionId: string;
    content: string;
    position: number;
  }[];
  matchingPairs?: {
    id: string;
    questionId: string;
    promptId: string;
    choiceId: string;
  }[];
}

interface AssignmentWithQuestions extends Assignment {
  questions: QuestionWithOptions[];
  courseId: string;
  chapterId: string;
}

interface StudentAssignmentViewProps {
  assignment: AssignmentWithQuestions;
  existingSubmission: Submission | null;
}

const createStepsFromQuestions = (
  questions: QuestionWithOptions[]
): StepItem[] => {
  return questions.map((question, index) => ({
    label: `Question ${index + 1}`,
  }));
};

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const StudentAssignmentView = ({
  assignment,
  existingSubmission,
}: StudentAssignmentViewProps) => {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<string[]>([]);
  const [questionFiles, setQuestionFiles] = useState<Record<string, string[]>>({});
  const [fillableAnswers, setFillableAnswers] = useState<Record<string, Record<string, string>>>({});
  const [blankAnswers, setBlankAnswers] = useState<Record<string, Record<string, string>>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, Record<string, string>>>({});
  // For drag and drop matching
  const [matchingItems, setMatchingItems] = useState<Record<string, {
    prompts: { id: string; content: string; position: number }[];
    choices: { id: string; content: string; position: number }[];
  }>>({});
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set isMounted to true when component mounts (needed for drag and drop)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  //Stepper
  const stepperRef = useRef<any & StepperProviderRef>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [stepperState, setStepperState] = useState<
    "loading" | "error" | undefined
  >("loading");

  const stepsObj = createStepsFromQuestions(assignment.questions);

  const { hasCompletedAllSteps } = useStepper();

  const goToNextStep = () => {
    setActiveStep((prevStep) => {
      const newStep = prevStep + 1;
      if (stepperRef.current) {
        stepperRef.current.setStep(newStep);
      }
      return newStep;
    });
  };

  const handleNextStep = () => {
    if (activeStep < assignment.questions.length - 1) {
      goToNextStep();
    }
  };

  const isQuiz = assignment.isQuiz;
  const isOnline = assignment.isOnline;
  const hasTimer = assignment.timer && assignment.timer > 0 && assignment.timer !== 4999;

  const handleUploadComplete = (url: string) => {
    setAttachments((prev) => [...prev, url]);
    toast.success("Archivo subido correctamente!");
  };

  const handleUploadError = (error: Error) => {
    toast.error("Error al subir el archivo");
    console.error("Error al subir el archivo:", error);
  };

  const handleDeleteFile = async (urlToDelete: string) => {
    try {
      // Delete file from S3
      await axios.post('/api/s3/delete-file', { fileUrl: urlToDelete });
      
      // Update local state
      setAttachments((prev) => prev.filter((url) => url !== urlToDelete));
      toast.success("Archivo eliminado correctamente!");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Error al eliminar el archivo");
    }
  };

  const handleQuestionFileUpload = (questionId: string, url: string) => {
    setQuestionFiles((prev) => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), url]
    }));
    toast.success("Archivo subido correctamente!");
  };

  const handleQuestionFileDelete = async (questionId: string, urlToDelete: string) => {
    try {
      // Delete file from S3
      await axios.post('/api/s3/delete-file', { fileUrl: urlToDelete });
      
      // Update local state
      setQuestionFiles((prev) => ({
        ...prev,
        [questionId]: (prev[questionId] || []).filter((url) => url !== urlToDelete)
      }));
      toast.success("Archivo eliminado correctamente!");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Error al eliminar el archivo");
    }
  };

  const handleFillableAnswerChange = (questionId: string, optionId: string, value: string) => {
    setFillableAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [optionId]: value
      }
    }));
  };
  
  const handleBlankAnswerChange = (questionId: string, blankId: string, value: string) => {
    setBlankAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [blankId]: value
      }
    }));
  };
  
  const handleMatchingAnswerChange = (questionId: string, promptId: string, choiceId: string) => {
    setMatchingAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [promptId]: choiceId
      }
    }));
  };
  
  // Initialize matching items for drag and drop
  useEffect(() => {
    if (assignment.questions) {
      const matchingQuestionsData: Record<string, {
        prompts: { id: string; content: string; position: number }[];
        choices: { id: string; content: string; position: number }[];
      }> = {};
      
      assignment.questions.forEach(question => {
        if (question.type === QuestionType.MATCHING && question.matchingPrompts && question.matchingChoices) {
          matchingQuestionsData[question.id] = {
            prompts: [...question.matchingPrompts],
            // Shuffle choices if configured to do so
            choices: question.matchingConfig?.shuffleChoices 
              ? [...question.matchingChoices].sort(() => Math.random() - 0.5)
              : [...question.matchingChoices]
          };
        }
      });
      
      setMatchingItems(matchingQuestionsData);
    }
  }, [assignment.questions]);
  
  // Handle drag and drop for matching questions
  const handleDragEnd = (result: DropResult, questionId: string) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // Get the current choices for this question
    const currentChoices = [...matchingItems[questionId].choices];
    
    // Get the dragged choice
    const [draggedChoice] = currentChoices.splice(source.index, 1);
    
    // If dropping onto a prompt (in the left column)
    if (destination.droppableId.startsWith('prompt-')) {
      const promptId = destination.droppableId.replace('prompt-', '');
      
      // Update the matching answers
      handleMatchingAnswerChange(questionId, promptId, draggedChoice.id);
    } 
    // If reordering within the choices column (right column)
    else if (destination.droppableId === 'choices-list') {
      // Insert the choice at the new position
      currentChoices.splice(destination.index, 0, draggedChoice);
      
      // Update the state with the new order
      setMatchingItems(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          choices: currentChoices
        }
      }));
    }
  };

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Add deadline check before submission
      if (assignment.deadline && new Date() > new Date(assignment.deadline)) {
        toast.error("La fecha límite para esta tarea ha pasado");
        return;
      }

      if (isOnline) {
        // Prepare answers for all question types
        const preparedAnswers = Object.entries(answers).map(([questionId, content]) => ({
          questionId,
          content,
        }));

        // Add fillable answers
        Object.entries(fillableAnswers).forEach(([questionId, blanks]) => {
          preparedAnswers.push({
            questionId,
            content: JSON.stringify(blanks), // Store as JSON for fillable answers
          });
        });
        
        // Add fill-in-the-blank answers
        Object.entries(blankAnswers).forEach(([questionId, blanks]) => {
          preparedAnswers.push({
            questionId,
            content: JSON.stringify(blanks), // Store as JSON for fill-in-the-blank answers
          });
        });
        
        // Add matching answers
        Object.entries(matchingAnswers).forEach(([questionId, pairs]) => {
          preparedAnswers.push({
            questionId,
            content: JSON.stringify(pairs), // Store as JSON for matching answers
          });
        });

        // Add file answers for open-ended with file questions
        Object.entries(questionFiles).forEach(([questionId, files]) => {
          if (files.length > 0) {
            preparedAnswers.push({
              questionId,
              content: JSON.stringify({ files }), // Store files as JSON
            });
          }
        });

         await axios.post(
          `/api/assignments/${assignment.id}/submit`,
          {
            answers: preparedAnswers,
            status: "SUBMITTED",
          }
        );
      } else {
        await axios.post(`/api/assignments/${assignment.id}/submit`, {
          attachments,
          status: "SUBMITTED",
        });
      }

      toast.success("Tarea enviada correctamente!");
      router.refresh();
      router.push(`/courses/${assignment.courseId}/chapters/${assignment.chapterId}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        toast.error("La fecha límite para esta tarea ha pasado");
      } else {
        toast.error("Algo salió mal");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const onTimeUp = () => {
    toast.warning("¡Tiempo agotado! Enviando tus respuestas...");
    onSubmit();
  };

  if (existingSubmission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="dark:bg-gradient-to-br dark:from-card/50 dark:to-background/30 dark:border-white/[0.05] dark:backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="dark:text-white/90">Tarea ya enviada</CardTitle>
            <CardDescription className="dark:text-white/70">
              Enviaste esta tarea el{" "}
              {new Date(existingSubmission.submittedAt!).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {existingSubmission.status === "GRADED" && (
              <div className="mt-4">
                <p className="font-medium">
                  Calificación: {existingSubmission.score}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Add deadline check before the main content
  if (assignment.deadline && new Date() > new Date(assignment.deadline)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="dark:bg-gradient-to-br dark:from-card/50 dark:to-background/30 dark:border-white/[0.05] dark:backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="dark:text-white/90">Tarea cerrada</CardTitle>
            <CardDescription className="dark:text-white/70">
              La fecha límite para esta tarea (
              {new Date(assignment.deadline).toLocaleString()}) ha pasado.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Card className="dark:bg-gradient-to-br dark:from-card/50 dark:to-background/30 dark:border-white/[0.05] dark:backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="dark:text-white/90">
            {assignment.title}
          </CardTitle>
          <CardDescription className="dark:text-white/70">
            {assignment.maxPoints} puntos
          </CardDescription>
        </CardHeader>
        <CardContent className="dark:text-white/70">
          {!existingSubmission && (
            <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  Entrega Pendiente
                </CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-300">
                  Debes completar y enviar esta tarea para poder continuar con el curso.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {assignment.description && (
            <div className="text-slate-600 dark:text-slate-300 mt-4">
              <Preview value={assignment.description} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {isOnline ? (
          <div className="space-y-8">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  Progreso: {activeStep + 1} de {assignment.questions.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(((activeStep + 1) / assignment.questions.length) * 100)}%
                </span>
              </div>
              <Progress 
                value={((activeStep + 1) / assignment.questions.length) * 100} 
                className="h-2"
              />
            </div>

            <Stepper
              ref={stepperRef}
              state={stepperState}
              orientation="horizontal"
              size="md"
              initialStep={0}
              steps={stepsObj}
              className="hidden"
            >
              {assignment.questions.map((question, index) => (
                <Step
                  key={question.id}
                  label={`${isQuiz ? "Pregunta" : "Parte"} ${index + 1}`}
                >
                  <motion.div
                    {...fadeIn}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="mt-4 shadow-lg border-t-4 border-t-primary dark:bg-gradient-to-br dark:from-card/50 dark:to-background/30 dark:border-white/[0.05] dark:backdrop-blur-xl">
                      <CardHeader className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="dark:bg-white/[0.08]">
                            {isQuiz ? `Pregunta ${index + 1}` : `Parte ${index + 1}`}
                          </Badge>
                          <Badge variant="secondary" className="dark:bg-white/[0.08]">
                            {question.points} puntos
                          </Badge>
                        </div>
                        <CardTitle className="text-xl dark:text-white/90">
                          {question.type !== QuestionType.FILL_IN_THE_BLANK && 
                           question.type !== QuestionType.MATCHING && 
                            <Preview value={question.content} />
                          }
                          {(question.type === QuestionType.FILL_IN_THE_BLANK || 
                            question.type === QuestionType.MATCHING) &&
                            <span>Pregunta {index + 1}</span>
                          }
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="pt-6">
                        {/* Hide the raw question content display */}
                        {false && <Preview value={question.content} />}
                        
                        {question.type === QuestionType.MULTIPLE_CHOICE ? (
                          <RadioGroup
                            onValueChange={(value) => {
                              setAnswers((prev) => ({
                                ...prev,
                                [question.id]: value,
                              }));
                            }}
                            value={answers[question.id]}
                            className="space-y-3"
                          >
                            {question.options.map((option) => (
                              <motion.div
                                key={option.id}
                                whileHover={{ scale: 1.01 }}
                                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors dark:border-white/[0.05] dark:hover:bg-white/[0.08]"
                              >
                                <RadioGroupItem
                                  value={option.content}
                                  id={option.id}
                                />
                                <Label className="flex-1 cursor-pointer dark:text-white/90" htmlFor={option.id}>
                                  {option.content}
                                </Label>
                              </motion.div>
                            ))}
                          </RadioGroup>
                        ) : question.type === QuestionType.FILL_IN_THE_BLANK ? (
                          <div className="space-y-4">
                            <div className="p-8 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 dark:border-white/[0.05] w-full">
                              <div className="mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                  Complete el texto llenando los espacios en blanco
                                </h3>
                              </div>
                              
                              {(() => {
                                try {
                                  // Create a regex to find all [blank:answer] patterns
                                  const blankRegex = /\[blank:(.*?)\]/g;
                                  
                                  // Get content and count blanks
                                  const content = question.content;
                                  const blankMatches = content.match(blankRegex) || [];
                                  const blankCount = blankMatches.length;
                                  
                                  if (blankCount === 0) {
                                    return <Preview value={content} />;
                                  }
                                  
                                  // Replace the content with input fields
                                  let blankIndex = 0;
                                  
                                  // Process the content and create a single string with special markers for inputs
                                  const processedContent = content.replace(blankRegex, () => {
                                    return `__INPUT_${blankIndex++}__`;
                                  });
                                  
                                  // Split the content by the input markers
                                  const parts = processedContent.split(/__INPUT_(\d+)__/);
                                  
                                  // Create the final result with text and inputs interspersed
                                  return (
                                    <div className="text-base dark:text-white/90 w-full">
                                      <div className="text-lg py-8">
                                        {parts.map((part, i) => {
                                          if (i % 2 === 0) {
                                            // Text part
                                            if (!part) return null;
                                            return (
                                              <span 
                                                key={`text-${i}`}
                                                className="select-none"
                                                dangerouslySetInnerHTML={{ __html: part }}
                                              />
                                            );
                                          } else {
                                            // Input part
                                            const blankId = `blank-${part}`;
                                            return (
                                              <Input
                                                key={`input-${part}`}
                                                className="inline-block align-baseline w-48 mx-2 px-3 h-10 border-b-2 border-primary bg-transparent"
                                                value={blankAnswers[question.id]?.[blankId] || ""}
                                                onChange={(e) => handleBlankAnswerChange(question.id, blankId, e.target.value)}
                                                placeholder="..."
                                              />
                                            );
                                          }
                                        })}
                                      </div>
                                    </div>
                                  );
                                } catch (error) {
                                  console.error("Error processing fill-in-the-blank question:", error);
                                  // If there's an error parsing, just show the raw content
                                  return <Preview value={question.content} />;
                                }
                              })()}
                            </div>
                          </div>
                        ) : question.type === QuestionType.MATCHING ? (
                          <div className="space-y-6">
                            <div className="p-6 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 dark:border-white/[0.05] w-full">
                              <div className="mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                  Relaciona cada elemento con su opción correspondiente
                                </h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                  Arrastra las opciones de la derecha hacia los elementos de la izquierda
                                </p>
                              </div>
                              
                              {matchingItems[question.id] && isMounted && (
                                <DragDropContext onDragEnd={(result) => handleDragEnd(result, question.id)}>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                    {/* Left column - Prompts */}
                                    <div className="space-y-4">
                                      <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300">Elementos</h4>
                                      {matchingItems[question.id].prompts.map((prompt, index) => (
                                        <Droppable key={prompt.id} droppableId={`prompt-${prompt.id}`}>
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.droppableProps}
                                              className={cn(
                                                "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                                                snapshot.isDraggingOver 
                                                  ? "border-blue-300 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-900/20" 
                                                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50",
                                                matchingAnswers[question.id]?.[prompt.id] && "border-green-300 dark:border-green-500/30"
                                              )}
                                            >
                                              <span className="text-sm font-medium w-6 text-center">{index + 1}.</span>
                                              <div className="flex-grow text-sm">
                                                {prompt.content}
                                              </div>
                                              
                                              {/* Show the matched choice if any */}
                                              {matchingAnswers[question.id]?.[prompt.id] && (
                                                <div className="ml-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700/30 text-sm">
                                                  {matchingItems[question.id].choices.find(c => c.id === matchingAnswers[question.id][prompt.id])?.content}
                                                </div>
                                              )}
                                              
                                              {provided.placeholder}
                                            </div>
                                          )}
                                        </Droppable>
                                      ))}
                                    </div>
                                    
                                    {/* Right column - Choices */}
                                    <div className="space-y-4">
                                      <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300">Opciones</h4>
                                      <Droppable droppableId="choices-list">
                                        {(provided) => (
                                          <div 
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="space-y-2"
                                          >
                                            {matchingItems[question.id].choices.map((choice, index) => (
                                              <Draggable 
                                                key={choice.id} 
                                                draggableId={choice.id} 
                                                index={index}
                                                isDragDisabled={Object.values(matchingAnswers[question.id] || {}).includes(choice.id)}
                                              >
                                                {(provided, snapshot) => (
                                                  <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={cn(
                                                      "p-3 rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-700 text-sm",
                                                      snapshot.isDragging && "shadow-lg ring-2 ring-blue-500",
                                                      Object.values(matchingAnswers[question.id] || {}).includes(choice.id) && 
                                                        "opacity-50 cursor-not-allowed"
                                                    )}
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <Grip className="h-4 w-4 mr-2 text-slate-400" />
                                                      <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                                                      {choice.content}
                                                    </div>
                                                  </div>
                                                )}
                                              </Draggable>
                                            ))}
                                            {provided.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                    </div>
                                  </div>
                                </DragDropContext>
                              )}
                              
                              {/* Fallback if no matching items are available */}
                              {!matchingItems[question.id] && (
                                <div className="py-4 text-center text-slate-500 dark:text-slate-400">
                                  No hay elementos disponibles para relacionar.
                                </div>
                              )}
                            </div>
                          </div>
                        ) : false ? ( // Removed FILLABLE_MULTIPLE_CHOICE condition
                          <div className="space-y-4">
                            <RadioGroup
                              onValueChange={(value) => {
                                setAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: value,
                                }));
                              }}
                              value={answers[question.id]}
                              className="space-y-3"
                            >
                              {question.options.map((option) => (
                                <motion.div
                                  key={option.id}
                                  whileHover={{ scale: 1.01 }}
                                  className="p-3 rounded-lg border dark:border-white/[0.05]"
                                >
                                  <div className="flex items-start space-x-3">
                                    <RadioGroupItem
                                      value={option.content}
                                      id={option.id}
                                      className="mt-1"
                                    />
                                    <div className="flex-1 space-y-2">
                                      <Label className="flex-1 cursor-pointer dark:text-white/90" htmlFor={option.id}>
                                        {option.hasBlank ? (
                                          <span>
                                            {option.content.replace(
                                              option.blankPlaceholder || "_____",
                                              option.blankPlaceholder || "_____"
                                            )}
                                          </span>
                                        ) : (
                                          option.content
                                        )}
                                      </Label>
                                      {option.hasBlank && (
                                        <div className="ml-4">
                                          <Input
                                            placeholder={`Escribe aquí (${option.blankPlaceholder || "respuesta"})`}
                                            value={fillableAnswers[question.id]?.[option.id] || ""}
                                            onChange={(e) => handleFillableAnswerChange(question.id, option.id, e.target.value)}
                                            className="dark:bg-white/[0.08] dark:border-white/[0.05] dark:placeholder:text-white/50"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </RadioGroup>
                          </div>
                        ) : question.type === QuestionType.OPEN_ENDED_WITH_FILE ? (
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Escribe tu respuesta aquí..."
                              value={answers[question.id] || ""}
                              onChange={(e) =>
                                setAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: e.target.value,
                                }))
                              }
                              className="min-h-[120px] resize-none dark:bg-white/[0.08] dark:border-white/[0.05] dark:placeholder:text-white/50"
                            />
                            <div className="space-y-2">
                              <Label className="text-sm font-medium dark:text-white/90">
                                Adjuntar archivos (opcional)
                              </Label>
                              <S3FileUpload
                                type="mixed"
                                onUploadComplete={(url) => handleQuestionFileUpload(question.id, url)}
                                onUploadError={(error) => console.error("Upload error:", error)}
                                acceptedFileTypes={[
                                  "image/jpeg",
                                  "image/png",
                                  "image/gif",
                                  "image/webp",
                                  "video/mp4",
                                  "video/webm",
                                  "video/quicktime",
                                  "application/pdf",
                                  "application/msword",
                                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                ]}
                                maxFileSize={50 * 1024 * 1024}
                              />
                              {(questionFiles[question.id] || []).length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium dark:text-white/90">Archivos subidos:</p>
                                  <div className="grid gap-2">
                                    {(questionFiles[question.id] || []).map((url, index) => (
                                      <div
                                        key={url}
                                        className="flex items-center justify-between gap-2 p-2 rounded border bg-muted/50 dark:border-white/[0.05] dark:bg-white/[0.08]"
                                      >
                                        <span className="text-sm truncate dark:text-white/90">
                                          {url.split("/").pop()}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleQuestionFileDelete(question.id, url)}
                                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Textarea
                            placeholder="Escribe tu respuesta aquí..."
                            value={answers[question.id] || ""}
                            onChange={(e) =>
                              setAnswers((prev) => ({
                                ...prev,
                                [question.id]: e.target.value,
                              }))
                            }
                            className="min-h-[150px] resize-none dark:bg-white/[0.08] dark:border-white/[0.05] dark:placeholder:text-white/50"
                          />
                        )}
                      </CardContent>

                      <CardFooter className="flex justify-between pt-6">
                        <Button
                          variant="outline"
                          disabled={activeStep === 0}
                          onClick={() => stepperRef.current?.previousStep()}
                          className="w-[120px] dark:border-white/[0.05] dark:hover:bg-white/[0.08]"
                        >
                          ← Anterior
                        </Button>
                        {activeStep === assignment.questions.length - 1 ? (
                          <Button 
                            onClick={onSubmit} 
                            disabled={isSubmitting}
                            className="w-[120px]"
                          >
                            {isSubmitting ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Enviando...
                              </span>
                            ) : (
                              isQuiz ? "Enviar Quiz" : "Enviar Tarea"
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={handleNextStep}
                            disabled={
                              question.type === QuestionType.MULTIPLE_CHOICE ? !answers[question.id] :
                              question.type === QuestionType.OPEN_ENDED || question.type === QuestionType.OPEN_ENDED_WITH_FILE ? !answers[question.id] && (questionFiles[question.id]?.length || 0) === 0 :
                              false // Always enable for FILL_IN_THE_BLANK and MATCHING to allow skipping
                            }
                            className="w-[120px]"
                          >
                            Siguiente →
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                </Step>
              ))}
            </Stepper>
          </div>
        ) : (
          <Card className="dark:bg-gradient-to-br dark:from-card/50 dark:to-background/30 dark:border-white/[0.05] dark:backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="dark:text-white/90">{isQuiz ? "Subir tu Quiz" : "Subir tu Tarea"}</CardTitle>
              <CardDescription className="dark:text-white/70">
                Subir tus archivos completados aquí
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <S3FileUpload
                  type="mixed"
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  acceptedFileTypes={[
                    // Images
                    "image/jpeg",
                    "image/png",
                    "image/gif",
                    "image/webp",
                    // Videos
                    "video/mp4",
                    "video/webm",
                    "video/quicktime",
                    // Documents
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  ]}
                  maxFileSize={100 * 1024 * 1024} // Increased to 100MB to accommodate videos
                />
                {attachments.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-medium dark:text-white/90">Archivos subidos:</p>
                    <div className="grid gap-2">
                      {attachments.map((url, index) => (
                        <div 
                          key={url} 
                          className="flex items-center justify-between gap-2 p-3 rounded-lg border dark:border-white/[0.05] dark:bg-white/[0.08] group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant="secondary" className="dark:bg-white/[0.08]">
                              {index + 1}
                            </Badge>
                            <span className="text-sm text-slate-600 dark:text-slate-300 truncate">
                              {url.split("/").pop()}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFile(url)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={onSubmit}
                disabled={isSubmitting || attachments.length === 0}
                className="w-full dark:bg-secondary dark:text-white dark:hover:bg-secondary/90"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  "Enviar Tarea"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};
