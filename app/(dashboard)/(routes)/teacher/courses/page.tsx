import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CoursesTable } from "./_components/courses-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataCard } from "./_components/data-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { redirect } from "next/navigation";
import { PaginationParams } from "@/types/pagination";
import { withTransaction } from "@/lib/db/transaction";
import { Accordion } from "@/components/ui/accordion";
import { BookOpen, GraduationCap, FolderKanban } from "lucide-react";

const fetchTeacherData = async (teacherId: string) => {
  return await prisma.$transaction(async (tx) => {
    // Get levels with basic course info
    const levels = await tx.level.findMany({
      where: {
        OR: [
          {
            teacherLevels: {
              some: { teacherId }
            }
          },
          {
            levelCourses: {
              some: {
                course: { teacherId }
              }
            }
          }
        ]
      },
      orderBy: {
        position: 'asc'
      },
      include: {
        levelCourses: {
          include: {
            course: {
              include: {
                teacher: true,
                studentCourses: true,
                modules: {
                  include: {
                    chapters: {
                      select: {
                        id: true,
                        title: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const transformedLevels = levels.map(level => ({
      ...level,
      levelCourses: level.levelCourses.map(lc => ({
        ...lc,
        course: {
          ...lc.course,
          isOwnCourse: lc.course.teacherId === teacherId
        }
      }))
    }));

    // Get unassigned courses separately
    const unassignedCourses = await tx.course.findMany({
      where: {
        AND: [
          { teacherId },
          { levelCourses: { none: {} } }
        ]
      },
      include: {
        teacher: true,
        studentCourses: true,
        modules: {
          include: {
            chapters: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    const transformedUnassignedCourses = unassignedCourses.map(course => ({
      ...course,
      isOwnCourse: course.teacherId === teacherId
    }));

    return {
      levels: transformedLevels,
      unassignedCourses: transformedUnassignedCourses
    };
  }, {
    timeout: 15000,
    maxWait: 20000,
  });
};

const CoursesPage = async () => {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) {
    redirect("/sign-in");
  }

  const { levels, unassignedCourses } = await fetchTeacherData(dbUser.id);

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 max-w-[calc(100vw-5px)] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-emerald-600/20 via-emerald-600/10 to-emerald-600/5 
              dark:from-emerald-600/30 dark:via-emerald-600/20 dark:to-transparent dark:border-white/[0.05] 
              dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border">
              <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-emerald-600 dark:text-white/90" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight md:text-4xl 
                text-success dark:text-accent-foreground font-['Open_Sans']">
                Gestión de Cursos
              </h2>
              <p className="text-xs dark:text-white/50 font-['Open_Sans']">
                Crea y administra el contenido de tus cursos
              </p>
            </div>
          </div>
          <Button asChild className="bg-primary/95 text-primary-foreground hover:bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 dark:bg-primary/80 dark:hover:bg-primary/90 dark-glow sm:text-sm text-xs">
            <Link href="/teacher/courses/create">
              Crear Nuevo Curso
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DataCard
            icon={<GraduationCap className="h-4 w-4 text-primary dark:text-primary/90" />}
            label="Grados"
            value={levels.length}
            description="Grados asignados"
            className="bg-gradient-to-br from-card/50 via-card/95 to-card/90 rounded-xl
              dark:from-black/40 dark:via-black/30 dark:to-black/20 
              dark:border-white/[0.05] dark:backdrop-blur-xl dark-glow
              hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          />
          <DataCard
            icon={<FolderKanban className="h-4 w-4 text-primary" />}
            label="Cursos sin asignar"
            value={unassignedCourses.length}
            description="Cursos sin asignar a algún grado"
            className="bg-gradient-to-br from-card via-card/95 to-card/90 rounded-xl shadow-lg 
              dark:from-black/40 dark:via-black/30 dark:to-black/20 
              dark:border-white/[0.05] dark:backdrop-blur-xl 
              dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]
              hover:shadow-xl transition-all duration-200
              dark:hover:shadow-[0_8px_32px_rgba(3,65,127,0.25)]"
          />
        </div>

        <div className="bg-gradient-to-br from-card/50 to-card rounded-xl border shadow-lg
          dark:from-black/40 dark:to-black/20 dark:border-white/[0.05] 
          dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <div className="p-4 sm:p-6 bg-card rounded-xl">
            <CoursesTable
              initialData={levels}
              unassignedCourses={unassignedCourses}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default CoursesPage;

export const revalidate = 0;