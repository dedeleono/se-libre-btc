import { prisma } from "@/lib/db";
import { SubmissionsList } from "./_components/submissions-list";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ScrollText, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SubmissionsPageProps {
  params: { assignmentId: string };
}

export default async function SubmissionsPage({
  params,
}: SubmissionsPageProps) {
  const session = await auth();

  if (!session?.user) {
    return redirect("/sign-in");
  }

  const [assignment, submissions] = await Promise.all([
    prisma.assignment.findUnique({
      where: {
        id: params.assignmentId,
      },
      include: {
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
    }),
    prisma.submission.findMany({
      where: {
        assignmentId: params.assignmentId,
      },
      include: {
        student: true,
        assignment: {
          include: {
            questions: true,
            studentAssignmentScores: {
              where: {
                studentId: {
                  in: (
                    await prisma.submission.findMany({
                      where: {
                        assignmentId: params.assignmentId
                      },
                      select: {
                        studentId: true
                      }
                    })
                  ).map(sub => sub.studentId)
                }
              }
            }
          },
        },
        answers: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  if (!assignment) {
    return redirect("/teacher/assignments");
  }

  if (!assignment) {
    return redirect("/teacher/assignments");
  }

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 max-w-[calc(100vw-5px)] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="flex items-start gap-3 md:gap-4">
          <Link 
            href="/teacher/assignments"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div
            className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-600/20 via-blue-600/10 to-blue-600/5 
            dark:from-blue-600/30 dark:via-blue-600/20 dark:to-transparent 
            border border-blue-500/10 dark:border-white/[0.05] 
            shadow-sm dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm
            group-hover:shadow-md transition-all duration-300"
          >
            <ScrollText className="h-6 w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2
                className="text-2xl md:text-3xl font-black tracking-tight md:text-4xl 
                bg-gradient-to-br from-blue-600 to-blue-800
                dark:from-blue-400 dark:to-blue-600
                bg-clip-text text-transparent
                font-['Open_Sans']"
              >
                {assignment.chapter.module.course.title}
              </h2>
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 
                  text-xs md:text-sm font-medium text-nowrap"
              >
                {submissions.length} entregas
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-1 pt-12">
        <p className="text-xl font-black text-muted-foreground dark:text-white/50 font-['Open_Sans']">
          {assignment.title}
        </p>
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            assignment.isQuiz
              ? "text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20"
              : "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
          )}
        >
          {assignment.isQuiz ? "Parcial" : "Tarea"}
        </Badge>
      </div>

      <div
        className="bg-gradient-to-br from-card/50 to-card rounded-xl border 
        shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_15px_rgba(0,0,0,0.08)]
        dark:from-black/40 dark:to-black/20 dark:border-white/[0.05] 
        dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_2px_15px_rgba(0,0,0,0.3)]
        dark:backdrop-blur-xl transition-all duration-300"
      >
        <div className="p-4 sm:p-6 rounded-xl">
          {submissions.length === 0 ? (
            <div
              className="flex min-h-[400px] flex-col items-center justify-center rounded-md 
              border border-dashed p-8 text-center animate-in fade-in-50 
              dark:border-white/[0.05]"
            >
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full 
                  bg-gradient-to-br from-blue-500/20 to-blue-600/20 
                  dark:from-blue-400/10 dark:to-blue-500/10 
                  shadow-inner"
                >
                  <ScrollText className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2
                  className="mt-6 text-xl font-semibold 
                  bg-gradient-to-br from-slate-800 to-slate-900 
                  dark:from-white/90 dark:to-white/70 
                  bg-clip-text text-transparent"
                >
                  No hay tareas recibidas todavía
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground dark:text-white/50">
                  Cuando los estudiantes envíen sus trabajos, aparecerán aquí
                  para su revisión
                </p>
              </div>
            </div>
          ) : (
            <SubmissionsList
              submissions={submissions}
              assignmentId={params.assignmentId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
