import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Submission {
  id: string;
  student: {
    name: string | null;
    email: string;
  };
  assignment: {
    title: string;
  };
  submittedAt: Date | null;
  status: "PENDING" | "SUBMITTED" | "GRADED";
  score: number | null;
}

async function getRecentSubmissions(teacherId: string): Promise<Submission[]> {
  return await prisma.submission.findMany({
    where: {
      assignment: {
        chapter: {
          module: {
            course: {
              OR: [
                { teacherId },
                {
                  levelCourses: {
                    some: {
                      level: {
                        teacherLevels: {
                          some: { teacherId }
                        }
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      },
      status: "SUBMITTED",
      score: null
    },
    select: {
      id: true,
      status: true,
      score: true,
      student: {
        select: {
          name: true,
          email: true
        }
      },
      assignment: {
        select: {
          title: true
        }
      },
      submittedAt: true
    },
    take: 5,
    orderBy: {
      submittedAt: "desc"
    }
  });
}

function SubmissionsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function SubmissionsList({ teacherId }: { teacherId: string }) {
  const submissions = await getRecentSubmissions(teacherId);

  if (!submissions.length) {
    return (
      <div className="text-center text-muted-foreground mt-10">
        No hay entregas pendientes de revisión
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div key={submission.id} className="flex items-center gap-x-4">
          <Avatar>
            <AvatarFallback>
              {submission.student.name?.[0] || submission.student.email[0]}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">
              {submission.student.name || submission.student.email}
            </p>
            <p className="text-sm text-muted-foreground">
              {submission.assignment.title}
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(submission.submittedAt || 0), "MMM d, HH:mm")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export async function RecentSubmissions({ teacherId }: { teacherId: string }) {
  const submissions = await getRecentSubmissions(teacherId);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
        <h3 className="font-semibold text-lg">Entregas Recientes</h3>
        <p className="text-sm text-muted-foreground sm:block hidden">
          Últimas tareas enviadas para revisión
        </p>
      </div>

      <div className="flex-1 p-3 sm:p-6">
        {submissions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Clock className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              No hay entregas pendientes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-start sm:items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 bg-foreground/10 text-success font-black">
                  <AvatarFallback>
                    {submission.student.name?.[0] || submission.student.email[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium truncate">
                    {submission.student.name || submission.student.email}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {submission.assignment.title}
                  </p>
                  <div className="flex items-center sm:hidden">
                    <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {submission.submittedAt
                        ? format(new Date(submission.submittedAt), "MMM d, HH:mm")
                        : "Pendiente"}
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <p className="text-sm text-muted-foreground">
                    {submission.submittedAt
                      ? format(new Date(submission.submittedAt), "MMM d, HH:mm")
                      : "Pendiente"}
                  </p>
                  <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                    Por revisar
                  </span>
                </div>
                
                {/* Mobile status badge */}
                <span className="sm:hidden inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                  Por revisar
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
