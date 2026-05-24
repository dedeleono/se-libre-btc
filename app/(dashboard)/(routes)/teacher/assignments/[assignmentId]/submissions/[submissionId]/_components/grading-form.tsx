"use client";

import { useEffect, useState } from "react";
import {
  Question,
  Answer,
  QuestionType as PrismaQuestionType,
  Submission,
  Assignment,
  User,
  QuestionOption,
} from "@prisma/client";

// Use the same QuestionType enum as Prisma
enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  OPEN_ENDED = "OPEN_ENDED",
  OPEN_ENDED_WITH_FILE = "OPEN_ENDED_WITH_FILE",
  FILL_IN_THE_BLANK = "FILL_IN_THE_BLANK",
  MATCHING = "MATCHING"
}
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Preview } from "@/components/preview";
import { FileIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SubmissionWithRelations extends Submission {
  answers: (Answer & {
    question: Question & {
      options: QuestionOption[];
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
    };
  })[];
  assignment: Assignment & {
    questions: Question[];
    chapter: {
      id: string;
      moduleId: string;
    };
  };
  student: User;
  attachments: {
    id: string;
    name: string;
    url: string;
    uploaderId: string;
    courseId: string | null;
    chapterId: string | null;
    submissionId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

interface GradingFormProps {
  submission: SubmissionWithRelations;
}

interface GradingPayload {
  scores: Record<string, number>;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  regradeReason?: string;
}

const FileSubmissionView = ({ 
  files 
}: { 
  files: SubmissionWithRelations['attachments']
}) => {
  if (!files || files.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-semibold">Archivos Enviados</h3>
      <div className="grid gap-4">
        {files.map((file) => (
          <div 
            key={file.id}
            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50"
          >
            <div className="flex items-center gap-x-2">
              <FileIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline"
            >
              Ver archivo
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export const GradingForm = ({ submission }: GradingFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fileSubmissionScore, setFileSubmissionScore] = useState<number>(
    submission.score ? (submission.score / (submission.assignment.maxPoints ?? 100)) * 100 : 0
  );
  const [answers, setAnswers] = useState(submission.answers);
  const [regradeReason, setRegradeReason] = useState("");
  const [isRegrade, setIsRegrade] = useState(submission.status === "GRADED");

  const assignmentMaxPoints = submission.assignment.maxPoints ?? 100;

  const handleQuestionScoreChange = (answerId: string, value: number) => {
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setAnswers(prev => 
        prev.map(a => a.id === answerId ? { ...a, score: value } : a)
      );
    }
  };

  useEffect(() => {
    if (submission.status === "GRADED") {
      setIsRegrade(true);
    }
  }, [submission.status]);

  const onSubmit = async () => {
    try {
      setIsLoading(true);

      let payload: GradingPayload;

      if (!submission.assignment.isOnline) {
        // For file submissions - treat as a single question worth 100 points
        payload = {
          scores: {},
          totalPoints: 100, // Always 100 for normalization
          earnedPoints: (fileSubmissionScore / 100) * assignmentMaxPoints,
          percentage: fileSubmissionScore // Store original percentage
        };
      } else {
        // For online submissions - normalize to 100 points total
        const scores = Object.fromEntries(
          answers.map(answer => [answer.id, answer.score || 0])
        );
        
        const totalEarnedPoints = answers.reduce((sum, a) => sum + (a.score || 0), 0);
        const percentageScore = (totalEarnedPoints / (answers.length * 100)) * 100;
        
        payload = {
          scores,
          totalPoints: 100, // Always 100 for normalization
          earnedPoints: (percentageScore / 100) * assignmentMaxPoints,
          percentage: percentageScore
        };
      }

      // Add regrade reason if this is a regrade
      if (isRegrade) {
        if (!regradeReason) {
          toast.error("Please provide a reason for regrading");
          setIsLoading(false);
          return;
        }
        payload.regradeReason = regradeReason;
      }

      const response = await axios.patch(`/api/submissions/${submission.id}/grade`, payload);
      
      if (response.data.status === "pending_approval") {
        toast.info(response.data.message);
      } else {
        toast.success("Submission graded successfully");
      }
      
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const isAnswerCorrect = (answer: SubmissionWithRelations["answers"][0]) => {
    if (answer.question.type === QuestionType.MULTIPLE_CHOICE) {
      return answer.content === answer.question.correctOption;
    }
    
    if (answer.question.type === QuestionType.FILL_IN_THE_BLANK) {
      try {
        // Parse student answers
        const studentAnswers = JSON.parse(answer.content);
        
        // Parse correct answers
        const correctAnswers = answer.question.correctOption ? 
          JSON.parse(answer.question.correctOption) : [];
        
        // Check if all blanks are filled correctly
        let allCorrect = true;
        
        correctAnswers.forEach((correct: {id: string, answer: string}) => {
          const studentAnswer = studentAnswers[correct.id];
          if (!studentAnswer || studentAnswer.toLowerCase().trim() !== correct.answer.toLowerCase().trim()) {
            allCorrect = false;
          }
        });
        
        return allCorrect;
      } catch (error) {
        return false;
      }
    }
    
    if (answer.question.type === QuestionType.MATCHING) {
      try {
        // Parse student answers (mapping of promptId -> choiceId)
        const studentAnswers = JSON.parse(answer.content);
        
        // Get the correct pairs from the question
        const correctPairs = answer.question.matchingPairs || [];
        
        // Check grading based on the scoring policy
        const scoringPolicy = answer.question.matchingConfig?.scoringPolicy || "PARTIAL_PER_PAIR";
        
        if (scoringPolicy === "ALL_OR_NOTHING") {
          // All pairs must be correct
          for (const pair of correctPairs) {
            const studentChoice = studentAnswers[pair.promptId];
            if (studentChoice !== pair.choiceId) {
              return false;
            }
          }
          return true;
        } else {
          // Check each pair individually
          const totalPairs = correctPairs.length;
          if (totalPairs === 0) return false;
          
          let correctCount = 0;
          for (const pair of correctPairs) {
            const studentChoice = studentAnswers[pair.promptId];
            if (studentChoice === pair.choiceId) {
              correctCount++;
            }
          }
          
          // For PARTIAL_PER_PAIR, we consider it correct if more than 50% are correct
          // For PARTIAL_WITH_PENALTY, we could implement a more complex scoring, but for now
          // we'll use the same threshold
          return correctCount / totalPairs >= 0.5;
        }
      } catch (error) {
        return false;
      }
    }
    
    return false;
  };

  return (
    <div className="space-y-6">
      {!submission.assignment.isOnline && (
        <>
          {submission.attachments && (
            <FileSubmissionView files={submission.attachments} />
          )}

          <Card className="border dark:border-white/[0.05] bg-white dark:bg-black/40">
            <CardHeader>
              <CardTitle
                className="text-xl font-semibold bg-gradient-to-br from-slate-800 to-slate-900 
                dark:from-white/90 dark:to-white/70 bg-clip-text text-transparent"
              >
                Calificar Entrega
              </CardTitle>
              <CardDescription className="text-muted-foreground dark:text-white/50">
                Puntaje máximo: {assignmentMaxPoints} puntos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground/90 dark:text-white/90">
                  Puntaje
                </Label>
                <div className="flex items-center gap-x-4">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={fileSubmissionScore}
                    onChange={(e) => {
                      if (e.target.value === "") {
                        setFileSubmissionScore(0);
                      } else {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= 100) {
                          setFileSubmissionScore(value);
                        }
                      }
                    }}
                    className="w-24 bg-white dark:bg-black/40 border dark:border-white/10 
                      focus:ring-blue-500/20 dark:focus:ring-blue-500/30 
                      dark:placeholder:text-white/30"
                  />
                  <span className="text-sm text-muted-foreground dark:text-white/50">
                    / 100
                  </span>
                </div>
              </div>

              <div
                className="p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white 
                dark:from-slate-900/50 dark:to-slate-800/50 border dark:border-white/[0.05]
                shadow-sm dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Puntaje Total
                    </p>
                    <p
                      className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 
                      dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent"
                    >
                      {!submission.assignment.isOnline
                        ? `${fileSubmissionScore}/${assignmentMaxPoints}`
                        : `${(answers.reduce((sum, a) => sum + (a.score || 0), 0) / answers.length).toFixed(1)}/${assignmentMaxPoints}`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isRegrade && (
            <div className="space-y-2 mt-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800 font-medium">
                  Esta entrega ya ha sido calificada. Tus cambios requerirán aprobación de administrador.
                </p>
              </div>
              <Label>Motivo de recalificación</Label>
              <textarea
                className="w-full p-2 border rounded-md min-h-[100px]"
                value={regradeReason}
                onChange={(e) => setRegradeReason(e.target.value)}
                placeholder="Explica por qué necesitas recalificar esta entrega..."
                required
              />
            </div>
          )}

          <Button
            onClick={onSubmit}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600/90 
              dark:hover:bg-blue-600 dark:text-white transition-colors"
          >
            {isRegrade ? "Solicitar Aprobación de Recalificación" : "Enviar Calificación"}
          </Button>
        </>
      )}

      {submission.assignment.isOnline && (
        <div className="space-y-6">
          {answers.map((answer) => (
            <Card
              key={answer.id}
              className="border dark:border-white/[0.05] bg-white dark:bg-black/40"
            >
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary dark:text-secondary">
                  <Preview value={answer.question.content} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {answer.question.type === QuestionType.MULTIPLE_CHOICE ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="sm:text-sm text-xs font-semibold text-secondary-foreground dark:text-white/70">
                        Respuesta del Estudiante:
                      </p>
                      <Badge
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          isAnswerCorrect(answer)
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                        )}
                      >
                        {isAnswerCorrect(answer) ? "Correcto" : "Incorrecto"}
                      </Badge>
                    </div>
                    <div
                      className={cn(
                        "p-4 rounded-lg border",
                        isAnswerCorrect(answer)
                          ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/10"
                          : "bg-rose-50/50 border-rose-200 dark:bg-rose-500/5 dark:border-rose-500/10"
                      )}
                    >
                      <p className="text-base dark:text-white/90">
                        {answer.content}
                      </p>
                    </div>
                  </div>
                ) : answer.question.type === QuestionType.FILL_IN_THE_BLANK ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="sm:text-sm text-xs font-semibold text-secondary-foreground dark:text-white/70">
                        Respuestas del Estudiante:
                      </p>
                      <Badge
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          isAnswerCorrect(answer)
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                        )}
                      >
                        {isAnswerCorrect(answer) ? "Correcto" : "Incorrecto"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Show the question content with blanks */}
                      <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 dark:border-white/[0.05]">
                        {(() => {
                          try {
                            // Parse correct answers from question
                            const correctAnswers = answer.question.correctOption ? 
                              JSON.parse(answer.question.correctOption) : [];
                            
                            // Parse student answers
                            const studentAnswers = JSON.parse(answer.content);
                            
                            // Create a regex to find all [blank:answer] patterns
                            const blankRegex = /\[blank:(.*?)\]/g;
                            
                            // Replace the content with highlighted answers
                            const content = answer.question.content;
                            let lastIndex = 0;
                            const parts: React.ReactNode[] = [];
                            let match: RegExpExecArray | null;
                            
                            // Process content to replace [blank:answer] with student answers
                            while ((match = blankRegex.exec(content)) !== null) {
                              // Add text before the blank
                              if (match.index > lastIndex) {
                                parts.push(
                                  <span key={`text-${match.index}`}>
                                    {content.substring(lastIndex, match.index)}
                                  </span>
                                );
                              }
                              
                              // Find the corresponding blank answer
                              const correctBlank = correctAnswers.find(
                                (b: {id: string, answer: string}) => match && b.answer === match[1]
                              );
                              
                              const blankId = correctBlank?.id || `blank-${match.index}`;
                              const studentAnswer = studentAnswers[blankId] || "";
                              const isCorrect = studentAnswer.toLowerCase().trim() === match[1].toLowerCase().trim();
                              
                              // Add highlighted student answer
                              parts.push(
                                <span
                                  key={`blank-${blankId}`}
                                  className={cn(
                                    "px-2 py-1 rounded mx-1 font-medium",
                                    isCorrect
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                                      : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300"
                                  )}
                                >
                                  {studentAnswer || "(sin respuesta)"}
                                </span>
                              );
                              
                              lastIndex = match.index + match[0].length;
                            }
                            
                            // Add any remaining text
                            if (lastIndex < content.length) {
                              parts.push(
                                <span key={`text-end`}>
                                  {content.substring(lastIndex)}
                                </span>
                              );
                            }
                            
                            return <div className="text-base dark:text-white/90">{parts}</div>;
                          } catch (error) {
                            // If there's an error parsing, just show the raw content
                            return <Preview value={answer.question.content} />;
                          }
                        })()}
                      </div>
                      
                      {/* Show correct answers */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium dark:text-white/90">Respuestas Correctas:</p>
                        <div className="grid gap-2">
                          {(() => {
                            try {
                              const correctAnswers = answer.question.correctOption ? 
                                JSON.parse(answer.question.correctOption) : [];
                              
                              const studentAnswers = JSON.parse(answer.content);
                              
                              return correctAnswers.map((correct: {id: string, answer: string}) => {
                                const studentAnswer = studentAnswers[correct.id] || "";
                                const isCorrect = studentAnswer.toLowerCase().trim() === correct.answer.toLowerCase().trim();
                                
                                return (
                                  <div 
                                    key={correct.id}
                                    className={cn(
                                      "p-3 rounded border flex justify-between items-center",
                                      isCorrect 
                                        ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/10"
                                        : "bg-rose-50/50 border-rose-200 dark:bg-rose-500/5 dark:border-rose-500/10"
                                    )}
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium dark:text-white/70">
                                          Respuesta del estudiante:
                                        </span>
                                        <span className="text-base dark:text-white/90">
                                          {studentAnswer || "(sin respuesta)"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm font-medium dark:text-white/70">
                                          Respuesta correcta:
                                        </span>
                                        <span className="text-base dark:text-white/90">
                                          {correct.answer}
                                        </span>
                                      </div>
                                    </div>
                                    <Badge
                                      className={cn(
                                        "px-2 py-1 text-xs",
                                        isCorrect
                                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                          : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                                      )}
                                    >
                                      {isCorrect ? "✓ Correcto" : "✗ Incorrecto"}
                                    </Badge>
                                  </div>
                                );
                              });
                            } catch (error) {
                              return (
                                <div className="p-4 rounded-lg border bg-rose-50/50 dark:bg-rose-500/5 dark:border-rose-500/10">
                                  <p className="text-sm text-rose-700 dark:text-rose-400">
                                    Error al procesar las respuestas
                                  </p>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : answer.question.type === QuestionType.MATCHING ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="sm:text-sm text-xs font-semibold text-secondary-foreground dark:text-white/70">
                        Respuestas del Estudiante:
                      </p>
                      <Badge
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          isAnswerCorrect(answer)
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                        )}
                      >
                        {isAnswerCorrect(answer) ? "Correcto" : "Incorrecto"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Show the matching pairs */}
                      <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 dark:border-white/[0.05]">
                        {(() => {
                          try {
                            // Parse student answers
                            const studentAnswers = JSON.parse(answer.content);
                            
                            // Get the correct pairs and prompts/choices
                            const correctPairs = answer.question.matchingPairs || [];
                            const prompts = answer.question.matchingPrompts || [];
                            const choices = answer.question.matchingChoices || [];
                            
                            // Create a map of choiceId to choice content for easier lookup
                            const choiceMap = new Map();
                            choices.forEach(choice => {
                              choiceMap.set(choice.id, choice.content);
                            });
                            
                            return (
                              <div className="space-y-3">
                                <p className="text-sm font-medium mb-2 dark:text-white/90">Relaciones del estudiante:</p>
                                {prompts.map(prompt => {
                                  const studentChoiceId = studentAnswers[prompt.id];
                                  const studentChoiceContent = studentChoiceId ? choiceMap.get(studentChoiceId) : null;
                                  
                                  // Find the correct choice for this prompt
                                  const correctPair = correctPairs.find(pair => pair.promptId === prompt.id);
                                  const correctChoiceId = correctPair?.choiceId;
                                  const isCorrect = studentChoiceId === correctChoiceId;
                                  
                                  return (
                                    <div 
                                      key={prompt.id}
                                      className={cn(
                                        "p-3 rounded border flex items-center",
                                        isCorrect
                                          ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/10"
                                          : "bg-rose-50/50 border-rose-200 dark:bg-rose-500/5 dark:border-rose-500/10"
                                      )}
                                    >
                                      <div className="flex-1 flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded border text-sm min-w-[150px]">
                                          {prompt.content}
                                        </div>
                                        <div className="flex-shrink-0">→</div>
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded border text-sm flex-1">
                                          {studentChoiceContent || "(sin respuesta)"}
                                        </div>
                                      </div>
                                      <Badge
                                        className={cn(
                                          "ml-4 px-2 py-1 text-xs",
                                          isCorrect
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                                        )}
                                      >
                                        {isCorrect ? "✓ Correcto" : "✗ Incorrecto"}
                                      </Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          } catch (error) {
                            // If there's an error parsing, show an error message
                            return (
                              <div className="p-4 rounded-lg border bg-rose-50/50 dark:bg-rose-500/5 dark:border-rose-500/10">
                                <p className="text-sm text-rose-700 dark:text-rose-400">
                                  Error al procesar las respuestas
                                </p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                      
                      {/* Show correct answers */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium dark:text-white/90">Relaciones Correctas:</p>
                        <div className="grid gap-2">
                          {(() => {
                            try {
                              // Get the correct pairs and prompts/choices
                              const correctPairs = answer.question.matchingPairs || [];
                              const prompts = answer.question.matchingPrompts || [];
                              const choices = answer.question.matchingChoices || [];
                              
                              // Create maps for easier lookup
                              const promptMap = new Map();
                              const choiceMap = new Map();
                              
                              prompts.forEach(prompt => {
                                promptMap.set(prompt.id, prompt.content);
                              });
                              
                              choices.forEach(choice => {
                                choiceMap.set(choice.id, choice.content);
                              });
                              
                              return correctPairs.map(pair => {
                                const promptContent = promptMap.get(pair.promptId);
                                const choiceContent = choiceMap.get(pair.choiceId);
                                
                                return (
                                  <div 
                                    key={pair.id}
                                    className="p-3 rounded border bg-slate-50/50 dark:bg-slate-900/50 dark:border-white/[0.05]"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-white dark:bg-slate-800 rounded border text-sm min-w-[150px]">
                                        {promptContent}
                                      </div>
                                      <div className="flex-shrink-0">→</div>
                                      <div className="p-2 bg-white dark:bg-slate-800 rounded border text-sm">
                                        {choiceContent}
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            } catch (error) {
                              return (
                                <div className="p-4 rounded-lg border bg-rose-50/50 dark:bg-rose-500/5 dark:border-rose-500/10">
                                  <p className="text-sm text-rose-700 dark:text-rose-400">
                                    Error al procesar las respuestas correctas
                                  </p>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : answer.question.type === QuestionType.OPEN_ENDED_WITH_FILE ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-secondary-foreground dark:text-white/70">
                        Respuesta del Estudiante:
                      </p>
                      <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 dark:border-white/[0.05]">
                        <Preview value={answer.content} />
                      </div>
                    </div>
                    {/* Show uploaded files */}
                    {(() => {
                      try {
                        const fileData = JSON.parse(answer.content);
                        if (fileData.files && fileData.files.length > 0) {
                          return (
                            <div className="space-y-2">
                              <p className="text-sm font-medium dark:text-white/90">Archivos subidos:</p>
                              <div className="grid gap-2">
                                {fileData.files.map((url: string, index: number) => (
                                  <div
                                    key={url}
                                    className="flex items-center gap-2 p-3 rounded border bg-slate-50/50 dark:bg-slate-900/50 dark:border-white/[0.05]"
                                  >
                                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm dark:text-white/90 truncate">
                                      {url.split("/").pop() || `Archivo ${index + 1}`}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(url, "_blank")}
                                      className="ml-auto"
                                    >
                                      Ver
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch (error) {
                        // If it's not JSON, it might be just text content, so we don't show files
                      }
                      return null;
                    })()}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-secondary-foreground dark:text-white/70">
                        Respuesta del Estudiante:
                      </p>
                      <div
                        className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 
                        dark:border-white/[0.05] text-primary dark:text-secondary"
                      >
                        <Preview value={answer.content} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground/90 dark:text-white/90">
                        Puntaje para esta pregunta
                      </Label>
                      <div className="flex items-center gap-x-4">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={
                            answers.find((a) => a.id === answer.id)?.score || 0
                          }
                          onChange={(e) =>
                            handleQuestionScoreChange(
                              answer.id,
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-24 bg-white dark:bg-black/40 border dark:border-white/10 
                            focus:ring-blue-500/20 dark:focus:ring-blue-500/30 
                            dark:placeholder:text-white/30"
                        />
                        <span className="text-sm text-muted-foreground dark:text-white/50">
                          / 100
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {isRegrade && (
            <div className="space-y-2 mt-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800 font-medium">
                  Esta entrega ya ha sido calificada. Tus cambios requerirán aprobación de administrador.
                </p>
              </div>
              <Label>Motivo de recalificación</Label>
              <textarea
                className="w-full p-2 border rounded-md min-h-[100px]"
                value={regradeReason}
                onChange={(e) => setRegradeReason(e.target.value)}
                placeholder="Explica por qué necesitas recalificar esta entrega..."
                required
              />
            </div>
          )}

          <Button
            onClick={onSubmit}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600/90 
              dark:hover:bg-blue-600 dark:text-white transition-colors"
          >
            {isRegrade ? "Solicitar Aprobación de Recalificación" : "Enviar Calificación"}
          </Button>
        </div>
      )}
    </div>
  );
};
