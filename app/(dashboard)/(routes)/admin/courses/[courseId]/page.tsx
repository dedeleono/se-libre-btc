import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  Clock,
  ArrowLeft,
  Pencil,
  Eye,
  CheckCircle2,
  XCircle,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface CoursePageProps {
  params: {
    courseId: string;
  };
}

const getCourseData = async (courseId: string) => {
  try {
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        teacher: true,
        modules: {
          include: {
            chapters: {
              include: {
                assignments: true,
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
        studentCourses: {
          include: {
            student: true,
          },
        },
        levelCourses: {
          include: {
            level: {
              include: {
                teacherLevels: {
                  include: {
                    teacher: true,
                  },
                },
                students: true,
              },
            },
          },
        },
        courseCategory: {
          include: {
            category: true,
          },
        },
        attachments: true,
      },
    });

    return course;
  } catch (error) {
    console.error("[GET_COURSE_DATA]", error);
    return null;
  }
};

export default async function AdminCoursePage({ params }: CoursePageProps) {
  const session = await auth();

  if (!session?.user) {
    return redirect("/");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return redirect("/");
  }

  const courseData = await getCourseData(params.courseId);

  if (!courseData) {
    return redirect("/admin/courses");
  }
  
  // Get the primary level for this course
  const primaryLevel = courseData.levelCourses.length > 0 ? courseData.levelCourses[0].level : null;

  // Calculate course statistics
  const totalModules = courseData.modules.length;
  const totalChapters = courseData.modules.reduce(
    (acc, module) => acc + module.chapters.length,
    0
  );
  const totalAssignments = courseData.modules.reduce(
    (acc, module) =>
      acc +
      module.chapters.reduce(
        (chAcc, chapter) => chAcc + chapter.assignments.length,
        0
      ),
    0
  );

  // Get students for this course
  const levelStudents = primaryLevel?.students || [];
  const totalStudents = levelStudents.length;

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-6 p-8">
        <div className="flex items-center gap-x-2 mb-6">
          <Link
            href="/admin/courses"
            className="flex items-center text-sm dark:text-white/70 hover:dark:text-white/90 
              transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            Volver a Cursos
          </Link>
        </div>

        {/* Course Information Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2 max-h-[calc(225px)]">
            <CardHeader className="flex flex-row items-center gap-x-3 space-y-0">
              <div className="p-2 bg-primary/10 rounded-full">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{courseData.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/15"
                  >
                    {primaryLevel?.name || "Sin nivel asignado"}
                  </Badge>
                  <Badge
                    variant={courseData.isPublished ? "default" : "secondary"}
                    className={cn(
                      courseData.isPublished
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    )}
                  >
                    {courseData.isPublished ? "Publicado" : "Borrador"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-4 mt-5">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Profesor
                </div>
                <div className="flex items-center gap-2">
                  {courseData.teacher ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {courseData.teacher.image ? (
                          <AvatarImage
                            src={courseData.teacher.image}
                            alt={courseData.teacher.firstName || "Teacher"}
                          />
                        ) : (
                          <AvatarFallback>
                            {courseData.teacher.firstName?.[0] || "T"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-base font-medium">
                        {courseData.teacher.firstName ||
                          courseData.teacher.name?.split(" ")[0] ||
                          "Profesor"}
                      </span>
                    </div>
                  ) : // Check if there's a level teacher available
                  primaryLevel &&
                    primaryLevel.teacherLevels &&
                    primaryLevel.teacherLevels.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {primaryLevel.teacherLevels[0].teacher.image ? (
                          <AvatarImage
                            src={primaryLevel.teacherLevels[0].teacher.image}
                            alt={
                              primaryLevel.teacherLevels[0].teacher.firstName ||
                              "Teacher"
                            }
                          />
                        ) : (
                          <AvatarFallback>
                            {primaryLevel.teacherLevels[0].teacher
                              .firstName?.[0] || "T"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <span className="text-base font-medium">
                          {primaryLevel.teacherLevels[0].teacher.firstName ||
                            primaryLevel.teacherLevels[0].teacher.name?.split(
                              " "
                            )[0] ||
                            "Profesor"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Sin profesor asignado
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Categoría
                </div>
                <div className="flex items-center gap-2">
                  {courseData.courseCategory &&
                  courseData.courseCategory.length > 0 ? (
                    <span className="text-base font-medium">
                      {courseData.courseCategory[0]?.category?.name ||
                        "Sin categoría"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Sin categoría
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Duración estimada
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-purple-100 rounded-full">
                    <Calendar className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-sm">
                    {courseData.courseStartDate && courseData.courseEndDate
                      ? `${Math.ceil(
                          (new Date(courseData.courseEndDate).getTime() -
                            new Date(courseData.courseStartDate).getTime()) /
                            (1000 * 60 * 60 * 24 * 7)
                        )} semanas`
                      : "Duración no definida"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full flex flex-col max-h-[calc(225px)]">
            <CardHeader className="pb-2">
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="space-y-4 pr-1">
                <div className="p-3 rounded-lg bg-blue-50 border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Módulos</p>
                      <p className="font-semibold text-lg">{totalModules}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-purple-50 border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capítulos</p>
                      <p className="font-semibold text-lg">{totalChapters}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-full">
                      <GraduationCap className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tareas</p>
                      <p className="font-semibold text-lg">
                        {totalAssignments}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-green-50 border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Estudiantes
                      </p>
                      <p className="font-semibold text-lg">
                        {totalStudents}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Content Section */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Contenido del Curso
              </h2>
              <p className="text-sm text-muted-foreground">
                Módulos, capítulos y tareas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/teacher/courses/${params.courseId}`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Curso
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/courses/${params.courseId}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Vista Estudiante
                </Link>
              </Button>
            </div>
          </div>
          <div className="p-6">
            <Tabs defaultValue="modules">
              <TabsList>
                <TabsTrigger value="modules">Módulos</TabsTrigger>
                <TabsTrigger value="students">Estudiantes</TabsTrigger>
                <TabsTrigger value="attachments">Recursos</TabsTrigger>
              </TabsList>

              <TabsContent value="modules" className="mt-6">
                {courseData.modules.length > 0 ? (
                  <div className="space-y-6">
                    {courseData.modules.map((module) => (
                      <Card key={module.id}>
                        <CardHeader>
                          <CardTitle>{module.title}</CardTitle>
                          <CardDescription>
                            {module.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {module.chapters.length > 0 ? (
                            <div className="space-y-4">
                              {module.chapters.map((chapter) => (
                                <div
                                  key={chapter.id}
                                  className="p-4 border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                      <BookOpen className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        {chapter.title}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {chapter.type === "LESSON"
                                          ? "Lección"
                                          : "Evaluación"}{" "}
                                        •
                                        {chapter.assignments.length > 0
                                          ? ` ${chapter.assignments.length} tarea${chapter.assignments.length > 1 ? "s" : ""}`
                                          : " Sin tareas"}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge
                                    variant={
                                      chapter.isPublished
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={cn(
                                      chapter.isPublished
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    )}
                                  >
                                    {chapter.isPublished ? (
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                    ) : (
                                      <XCircle className="h-3 w-3 mr-1" />
                                    )}
                                    {chapter.isPublished
                                      ? "Publicado"
                                      : "Borrador"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center border rounded-lg bg-gray-50/50">
                              <p className="text-muted-foreground">
                                Este módulo no tiene capítulos
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border rounded-lg bg-gray-50/50">
                    <p className="text-muted-foreground">
                      Este curso no tiene módulos
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="students" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Estudiantes Inscritos</CardTitle>
                    <CardDescription>
                      Total: {totalStudents} estudiantes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {totalStudents > 0 ? (
                      <div className="space-y-2">
                        {levelStudents.map((student) => (
                          <div
                            key={student.id}
                            className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-full">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {student.firstName ||
                                    student.name ||
                                    student.email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={student.id ? "default" : "secondary"}
                              className={cn(
                                student.id && "bg-sky-100 text-sky-700 p-1"
                              )}
                            >
                              <Link href={`/student/${student.id}`}>
                                <ExternalLink className="h-5 w-5" />
                              </Link>
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center border rounded-lg bg-gray-50/50">
                        <p className="text-muted-foreground">
                          Este curso no tiene estudiantes inscritos
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attachments" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recursos del Curso</CardTitle>
                    <CardDescription>
                      Archivos y materiales adicionales
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {courseData.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {courseData.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-full">
                                <BookOpen className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{attachment.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {attachment.url
                                    .split(".")
                                    .pop()
                                    ?.toUpperCase()}{" "}
                                  •
                                  {format(
                                    new Date(attachment.createdAt),
                                    "dd MMM yyyy",
                                    { locale: es }
                                  )}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={attachment.url} target="_blank">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center border rounded-lg bg-gray-50/50">
                        <p className="text-muted-foreground">
                          Este curso no tiene recursos adicionales
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
