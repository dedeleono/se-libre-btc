import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Download, ClipboardCheck, Check, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Preview } from "@/components/preview";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

interface SubmissionPageProps {
  params: {
    submissionId: string;
  };
  searchParams: {
    studentId?: string;
  };
}

export default async function SubmissionPage({ 
  params,
  searchParams 
}: SubmissionPageProps) {
  const session = await auth();

  if (!session?.user) {
    return redirect("/");
  }

  const submission = await prisma.submission.findUnique({
    where: {
      id: params.submissionId,
      studentId: searchParams.studentId || session.user.id,
    },
    include: {
      assignment: {
        include: {
          questions: {
            include: {
              options: true,
            },
          },
          chapter: {
            include: {
              module: {
                include: {
                  course: true,
                },
              },
            },
          },
        },
      },
      answers: {
        include: {
          question: {
            include: {
              options: true,
            },
          },
        },
      },
      attachments: true,
    },
  });

  if (
    submission?.studentId !== session.user.id && 
    !["ADMIN", "TEACHER"].includes(session.user.role)
  ) {
    return redirect("/");
  }

  if (!submission) {
    return redirect("/student/portfolio");
  }

  return (
    <div className="p-6 space-y-8 animate-fadeIn">
      {/* Header with subtle gradient background */}
      <div className="flex items-center gap-x-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-4 backdrop-blur-sm">
        <Link href="/student/portfolio">
          <Button 
            variant="ghost" 
            size="sm"
            className="hover:-translate-x-1 transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold text-xl">{submission.assignment.title}</h1>
          <p className="text-sm text-muted-foreground">
            {submission.assignment.chapter.module.course.title}
          </p>
        </div>
        <Badge 
          variant={submission.assignment.isQuiz ? "default" : "secondary"}
          className="animate-in slide-in-from-right duration-300"
        >
          {submission.assignment.isQuiz ? "Quiz" : "Tarea"}
        </Badge>
      </div>

      <div className="grid gap-6">
        {/* Score card with progress ring */}
        <Card className="p-6 relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <div className="relative">
              <p className="text-sm font-medium text-muted-foreground">Calificación</p>
              <div className="flex items-baseline gap-x-2 mt-1">
                {submission.score !== null ? (
                  <>
                    <span className={cn(
                      "font-medium transition-colors duration-300 text-lg",
                      submission.score >= 70 ? "text-green-600" :
                      submission.score < 50 ? "text-red-600" :
                      "text-yellow-600"
                    )}>
                      {submission.score.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">/ {submission.assignment.maxPoints}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Pendiente</span>
                )}
              </div>
              {submission.score && (
                <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
              )}
            </div>
            <div className="text-right relative z-10">
              <p className="text-sm font-medium">Fecha de entrega</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(submission?.submittedAt || new Date()), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>
        </Card>

        {/* Quiz answers with improved visual hierarchy */}
        {submission.assignment.isQuiz && (
          <div className="space-y-6">
            <div className="flex items-center gap-x-2 border-b pb-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h2 className="font-medium">Tus respuestas</h2>
            </div>
            <div className="grid gap-4">
              {submission.answers.map((answer, index) => (
                <Card 
                  key={answer.id} 
                  className="group overflow-hidden border-l-4 hover:border-l-primary transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-x-4">
                      <span className="text-sm text-muted-foreground font-medium">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-x-4">
                            <div className="text-sm">
                              <Preview value={answer.question.content} />
                            </div>
                            <Badge 
                              variant={answer.content === answer.question.correctOption ? "default" : "destructive"}
                              className="shrink-0 animate-in zoom-in duration-300"
                            >
                              {answer.content === answer.question.correctOption ? (
                                <span className="flex items-center gap-x-1">
                                  <Check className="h-3 w-3" /> Correcto
                                </span>
                              ) : (
                                <span className="flex items-center gap-x-1">
                                  <X className="h-3 w-3" /> Incorrecto
                                </span>
                              )}
                            </Badge>
                          </div>
                        </div>
                        {answer.question.type === "MULTIPLE_CHOICE" ? (
                          <div className="space-y-3">
                            {answer.question.options?.map((option) => {
                              const isSelected = option.content === answer.content;
                              const isCorrect = option.content === answer.question.correctOption;
                              
                              return (
                                <div
                                  key={option.id}
                                  className={cn(
                                    "relative p-4 rounded-xl flex items-center gap-x-3 border-2 transition-all duration-200",
                                    isSelected && isCorrect && "bg-emerald-50/50 border-emerald-300",
                                    isSelected && !isCorrect && "bg-red-50/50 border-red-300",
                                    !isSelected && isCorrect && "bg-emerald-50/20 border-emerald-200/70",
                                    !isSelected && !isCorrect && "bg-white border-slate-200"
                                  )}
                                >
                                  {/* Content wrapper */}
                                  <div className="flex-1 flex items-center justify-between">
                                    <div className="flex-1">
                                      <Preview value={option.content} />
                                    </div>
                                    
                                    {/* Status badges */}
                                    <div className="flex items-center gap-x-2 ml-4">
                                      {isSelected && (
                                        <div className={cn(
                                          "flex items-center gap-x-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                                          isCorrect 
                                            ? "bg-emerald-100/70 text-emerald-700 ring-1 ring-emerald-200" 
                                            : "bg-red-100/70 text-red-700 ring-1 ring-red-200"
                                        )}>
                                          <div className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            isCorrect ? "bg-emerald-500" : "bg-red-500"
                                          )} />
                                          Tu respuesta
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Show correct answer when user got it wrong */}
                            {answer.content !== answer.question.correctOption && (
                              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                                <div className="flex items-center gap-x-2 text-sm text-emerald-800">
                                  <div className="font-medium">Respuesta correcta:</div>
                                  <div>
                                    <Preview value={answer.question.correctOption as string} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                              <small className="text-emerald-800">Respuesta Correcta:</small>
                            <Preview value={answer.content || ""} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* File attachments with improved interaction */}
        {submission.attachments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-x-2 border-b pb-2">
              <Download className="h-5 w-5 text-primary" />
              <h2 className="font-medium">Archivos adjuntos</h2>
            </div>
            <div className="grid gap-2">
              {submission.attachments.map((attachment) => (
                <Link
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  className="group flex items-center justify-between p-3 rounded-lg hover:bg-accent/10 transition-all duration-200"
                >
                  <span className="text-sm group-hover:text-primary transition-colors">
                    {attachment.name}
                  </span>
                  <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Teacher feedback with visual improvements */}
        {submission.teacherFeedback && (
          <div className="space-y-4">
            <div className="flex items-center gap-x-2 border-b pb-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="font-medium">Retroalimentación</h2>
            </div>
            <div className="rounded-lg bg-primary/5 p-4 relative overflow-hidden">
              <div className="relative z-10">
                <Preview value={submission.teacherFeedback} />
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 