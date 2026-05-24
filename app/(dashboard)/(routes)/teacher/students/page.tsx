import { StudentsTable } from "./_components/students-table";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { GraduationCap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function StudentsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Get all students for this teacher
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        OR: [
          {
            studentCourses: {
              some: {
                course: {
                  teacherId: session.user.id,
                },
              },
            },
          },
          {
            studentLevel: {
              teacherLevels: {
                some: {
                  teacherId: session.user.id,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        studentLevel: {
          select: {
            name: true,
          },
        },
        assignmentScores: {
          select: {
            score: true,
          },
        },
        submissions: {
          select: {
            assignment: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 max-w-[calc(100vw-5px)] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 
              dark:from-primary/30 dark:via-primary/20 dark:to-transparent dark:border-white/[0.05] 
              dark:shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:backdrop-blur-sm border">
              <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary dark:text-white/90" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight md:text-4xl 
                bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent
                dark:from-white dark:to-white/70 font-['Open_Sans']">
                Tus Estudiantes
              </h2>
              <p className="text-xs dark:text-white/50 font-['Open_Sans']">
                Administra y supervisa el progreso de tus estudiantes en todos tus cursos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-card/50 to-card rounded-xl border shadow-lg
          dark:from-black/40 dark:to-black/20 dark:border-white/[0.05] 
          dark:backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <div className="p-4 sm:p-6 bg-card rounded-xl">
            {students.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <GraduationCap className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="mt-6 text-xl font-semibold">
                    No students enrolled
                  </h2>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    Students will appear here once they enroll in your courses
                  </p>
                </div>
              </div>
            ) : (
              <StudentsTable students={students} />
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
