import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Mail, User2, Copy, CreditCard, ArrowLeft, ScrollText, BookOpen, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CopyEmail } from "./_components/copy-email";
import { Course, User, UserRole, Level, LevelTeacher, StudentAssignmentScore } from "@prisma/client";
import Link from "next/link";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AssignTeacherButton } from "./_components/assign-teacher-button";

interface TeacherPageProps {
  params: {
    teacherId: string;
  };
}

interface TeacherWithRelations extends User {
  teacherLevels: (LevelTeacher & {
    level: Level & {
      levelCourses: {
        course: Course;
      }[];
    };
  })[];
  teacherCourses: Course[];
  submissions: any[];
  assignmentScores: StudentAssignmentScore[];
  isDeleted: boolean;
}

const getTeacherData = async (teacherId: string): Promise<TeacherWithRelations | null> => {
  try {
    const teacher = await prisma.user.findUnique({
      where: {
        id: teacherId,
        role: "TEACHER",
      },
      include: {
        teacherLevels: {
          include: {
            level: {
              include: {
                levelCourses: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        },
        teacherCourses: true,
        submissions: {
          include: {
            assignment: {
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
                questions: {
                  include: {
                    options: true,
                  },
                },
              },
            },
            answers: {
              include: {
                question: true,
              },
            },
            attachments: true,
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
        assignmentScores: true,
      },
    });

    if (!teacher) return null;

    // Combine direct courses and courses from levels
    const allCourses = new Set([
      ...teacher.teacherCourses,
      ...teacher.teacherLevels.flatMap(tl => 
        tl.level.levelCourses.map(lc => lc.course)
      )
    ]);

    const availableLevels = await prisma.level.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    return {
      ...teacher,
      teacherCourses: Array.from(allCourses),
      availableLevels: availableLevels
    } as TeacherWithRelations;
  } catch (error) {
    console.error("[GET_TEACHER_DATA]", error);
    return null;
  }
};

const calculateAverageScore = (scores: { score: number }[]) => {
  if (!scores.length) return 0;
  const total = scores.reduce((acc, score) => acc + score.score, 0);
  return Math.round((total / scores.length) * 10) / 10;
};

export default async function TeacherPage({ params }: TeacherPageProps) {
  const session = await auth();

  if (!session?.user) {
    return redirect("/");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return redirect("/");
  }

  const teacherData = await getTeacherData(params.teacherId);

  if (!teacherData) {
    return redirect("/teacher/students");
  }

  const formattedCourses = teacherData.teacherCourses.map((course) => ({
    id: course.id,
    title: course.title,
    submissions: teacherData.submissions.filter(
      (s) => s.assignment.chapter.module.course.id === course.id
    ),
  }));

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-6 p-8">
        {session.user.role === "ADMIN" && (
          <div className="flex items-center gap-x-2 mb-6">
            <Link
              href="/admin/sp"
              className="flex items-center text-sm dark:text-white/70 hover:dark:text-white/90 
                transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
              Volver a Profesores
            </Link>
          </div>
        )}

        {/* Teacher Information Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center gap-x-3 space-y-0">
              <div className="p-2 bg-primary/10 rounded-full">
                <User2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {teacherData.firstName || teacherData.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/15"
                  >
                    {teacherData.teacherLevels[0]?.level.name ||
                      "Sin nivel asignado"}
                  </Badge>
                  <Badge
                    variant={teacherData.isDeleted ? "destructive" : "default"}
                    className={cn(
                      teacherData.isDeleted
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    )}
                  >
                    {teacherData.isDeleted ? "Inactivo" : "Activo"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-2 mt-5">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Email
                </div>
                <CopyEmail email={teacherData.email} />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Cursos Asignados
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-lg font-semibold text-primary">
                    {teacherData.teacherCourses.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Asignar Nivel</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignTeacherButton
                teacherId={teacherData.id}
                availableLevels={teacherData.teacherLevels.map((tl) => ({
                  id: tl.level.id,
                  name: tl.level.name,
                }))}
                className="h-[140px] w-full flex flex-col items-center justify-center gap-2 
                  border-2 border-dashed rounded-lg
                  border-primary/40 bg-primary/5 
                  hover:border-primary hover:bg-primary/10 hover:scale-[1.02] hover:shadow-md
                  transition-all duration-200 group"
              >
                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium text-primary transition-colors">
                  Asignar a un nuevo nivel
                </p>
              </AssignTeacherButton>
            </CardContent>
          </Card>
        </div>

        {/* Teaching Activity Section */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Actividad de Enseñanza
              </h2>
              <p className="text-sm text-muted-foreground">
                Registro de calificaciones y actividades recientes
              </p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              {/* Total Graded Assignments Card */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Tareas Calificadas
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {teacherData.assignmentScores.length}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <ScrollText className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Average Score Card */}
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Promedio de Calificaciones
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {calculateAverageScore(teacherData.assignmentScores)}pts
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Active Courses Card */}
              <div className="p-4 rounded-lg bg-violet-50 border border-violet-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Cursos Activos
                    </p>
                    <p className="text-2xl font-bold text-violet-600">
                      {teacherData.teacherCourses.length}
                    </p>
                  </div>
                  <div className="p-2 bg-violet-100 rounded-full">
                    <BookOpen className="h-5 w-5 text-violet-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teaching Courses Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cursos Asignados</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-4">
              {teacherData.teacherLevels.map((levelTeacher) => (
                <AccordionItem
                  key={levelTeacher.id}
                  value={levelTeacher.id}
                  className="border rounded-lg px-6 overflow-hidden bg-gradient-to-r from-white to-slate-50 
                    transition-all duration-300 ease-out shadow-sm hover:shadow-md
                    dark:from-black/40 dark:to-black/20 dark:border-white/[0.05]"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center justify-between flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-semibold">
                          {levelTeacher.level.name}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary hover:bg-primary/15"
                      >
                        {levelTeacher.level.levelCourses?.length || 0} cursos
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {levelTeacher.level.levelCourses?.map((lc) => (
                        <div
                          key={lc.course.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-success/10 rounded-lg">
                              <GraduationCap className="h-6 w-6 text-success" />
                            </div>
                            <div>
                              <h3 className="font-medium">{lc.course.title}</h3>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {lc.course.isPublished ? "Publicado" : "Borrador"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
