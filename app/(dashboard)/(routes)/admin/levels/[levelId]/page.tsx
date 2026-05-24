import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  DollarSign,
  ArrowLeft,
  PlusCircle,
  School,
  Layers,
  User,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LevelPageProps {
  params: {
    levelId: string;
  };
}

const getLevelData = async (levelId: string) => {
  try {
    return await prisma.level.findUnique({
      where: {
        id: levelId,
      },
      include: {
        students: {
          where: {
            role: "STUDENT",
            isDeleted: false,
          },
        },
        levelCourses: {
          include: {
            course: {
              include: {
                modules: {
                  include: {
                    chapters: {
                      include: {
                        assignments: true,
                      },
                    },
                  },
                },
                teacher: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        teacherLevels: {
          include: {
            teacher: true,
          },
        },
        payments: true,
      },
    });
  } catch (error) {
    console.error("[GET_LEVEL_DATA]", error);
    return null;
  }
};

export default async function AdminLevelPage({ params }: LevelPageProps) {
  const session = await auth();

  if (!session?.user) {
    return redirect("/");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return redirect("/");
  }

  const levelData = await getLevelData(params.levelId);

  if (!levelData) {
    return redirect("/admin/courses");
  }
  
  // Calculate level statistics
  const totalStudents = levelData.students.length;
  const totalCourses = levelData.levelCourses.length;
  
  // Calculate total modules and chapters across all courses in this level
  const courseStats = levelData.levelCourses.reduce((acc, lc) => {
    const course = lc.course;
    const totalModules = course.modules.length;
    
    const totalChapters = course.modules.reduce(
      (moduleAcc, module) => moduleAcc + module.chapters.length,
      0
    );
    
    const totalAssignments = course.modules.reduce(
      (moduleAcc, module) => 
        moduleAcc + module.chapters.reduce(
          (chapterAcc, chapter) => chapterAcc + chapter.assignments.length,
          0
        ),
      0
    );
    
    return {
      modules: acc.modules + totalModules,
      chapters: acc.chapters + totalChapters,
      assignments: acc.assignments + totalAssignments,
    };
  }, { modules: 0, chapters: 0, assignments: 0 });

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
            Volver a Niveles
          </Link>
        </div>

        {/* Level Information Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2 max-h-[calc(225px)]">
            <CardHeader className="flex flex-row items-center gap-x-3 space-y-0">
              <div className="p-2 bg-primary/10 rounded-full">
                <School className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{levelData.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/15"
                  >
                    Posición {levelData.position}
                  </Badge>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    {totalCourses} {totalCourses === 1 ? "Curso" : "Cursos"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-4 mt-5">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Estudiantes
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-base font-medium">
                    {totalStudents}{" "}
                    {totalStudents === 1 ? "Estudiante" : "Estudiantes"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Precio del Nivel
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-base font-medium">
                    {levelData.price
                      ? `$${levelData.price.toFixed(2)}`
                      : "No definido"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Precio de Inscripción
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-base font-medium">
                    {levelData.inscriptionPrice
                      ? `Q.${levelData.inscriptionPrice.toFixed(2)}`
                      : "No definido"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Profesores Asignados
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <GraduationCap className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-base font-medium">
                    {levelData.teacherLevels.length}{" "}
                    {levelData.teacherLevels.length === 1
                      ? "Profesor"
                      : "Profesores"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full flex flex-col max-h-[calc(225px)]">
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="space-y-4 ">
                <div className="p-3 rounded-lg bg-blue-50 border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Layers className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Módulos</p>
                      <p className="font-semibold text-lg">
                        {courseStats.modules}
                      </p>
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
                      <p className="font-semibold text-lg">
                        {courseStats.chapters}
                      </p>
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
                        {courseStats.assignments}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Section */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Cursos del Nivel
              </h2>
              <p className="text-sm text-muted-foreground">
                {totalCourses}{" "}
                {totalCourses === 1 ? "curso asignado" : "cursos asignados"} a
                este nivel
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/courses/${params.levelId}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Nivel
                </Link>
              </Button> */}
              <Button size="sm" asChild>
                <Link href={`/admin/courses/new?levelId=${params.levelId}`}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nuevo Curso
                </Link>
              </Button>
            </div>
          </div>
          <div className="p-6">
            <Tabs defaultValue="courses">
              <TabsList>
                <TabsTrigger value="courses">Cursos</TabsTrigger>
                <TabsTrigger value="students">Estudiantes</TabsTrigger>
                <TabsTrigger value="teachers">Profesores</TabsTrigger>
              </TabsList>

              <TabsContent value="courses" className="mt-6">
                {levelData.levelCourses.length > 0 ? (
                  <div className="space-y-4">
                    {levelData.levelCourses.map((lc) => (
                      <div
                        key={lc.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex items-center gap-2 flex-row justify-between">
                              <Link
                                href={`/admin/courses/${params.levelId}/${lc.course.id}`}
                                className="text-lg font-medium hover:underline"
                              >
                                {lc.course.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={
                                    lc.course.isPublished
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={cn(
                                    lc.course.isPublished
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  )}
                                >
                                  {lc.course.isPublished
                                    ? "Publicado"
                                    : "Borrador"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/admin/courses/${params.levelId}/${lc.course.id}`}
                            >
                              Ver Detalles
                            </Link>
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Profesor
                            </p>
                            <p className="font-medium">
                              {lc.course.teacher ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="size-sm w-6 h-6">
                                    <AvatarImage
                                      src={lc.course.teacher.image as string}
                                      alt={
                                        lc.course.teacher.name ||
                                        lc.course.teacher.email
                                      }
                                    />
                                    <AvatarFallback>
                                      {lc.course.teacher.name?.[0] ||
                                        lc.course.teacher.firstName?.[0] ||
                                        lc.course.teacher.email?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              ) : // Check if there are level teachers available
                              levelData.teacherLevels.length > 0 ? (
                                <Avatar className="size-xs w-6 h-6">
                                  <AvatarImage
                                    src={
                                      levelData.teacherLevels[0].teacher
                                        .image as string
                                    }
                                    alt={
                                      levelData.teacherLevels[0].teacher.name ||
                                      levelData.teacherLevels[0].teacher.email
                                    }
                                  />
                                  <AvatarFallback>
                                    {levelData.teacherLevels[0].teacher
                                      .name?.[0] ||
                                      levelData.teacherLevels[0].teacher
                                        .firstName?.[0] ||
                                      levelData.teacherLevels[0].teacher
                                        .email?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                "Sin profesor asignado"
                              )}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Módulos
                            </p>
                            <p className="font-medium">
                              {lc.course.modules.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border rounded-lg bg-gray-50/50">
                    <p className="text-muted-foreground">
                      Este nivel no tiene cursos asignados
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="students" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Estudiantes del Nivel</CardTitle>
                    <CardDescription>
                      Total: {totalStudents}{" "}
                      {totalStudents === 1 ? "estudiante" : "estudiantes"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {totalStudents > 0 ? (
                      <div className="space-y-2">
                        {levelData.students.map((student) => (
                          <div
                            key={student.id}
                            className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-full">
                                <User className="h-4 w-4 text-primary" />
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
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/sp/${student.id}`}>
                                Ver Perfil
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center border rounded-lg bg-gray-50/50">
                        <p className="text-muted-foreground">
                          Este nivel no tiene estudiantes asignados
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="teachers" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profesores del Nivel</CardTitle>
                    <CardDescription>
                      Total: {levelData.teacherLevels.length}{" "}
                      {levelData.teacherLevels.length === 1
                        ? "profesor"
                        : "profesores"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {levelData.teacherLevels.length > 0 ? (
                      <div className="space-y-2">
                        {levelData.teacherLevels.map((tl) => (
                          <div
                            key={tl.id}
                            className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-full">
                                <GraduationCap className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {tl.teacher.firstName ||
                                    tl.teacher.name ||
                                    tl.teacher.email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {tl.teacher.email}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/teachers/${tl.teacher.id}`}>
                                Ver Perfil
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center border rounded-lg bg-gray-50/50">
                        <p className="text-muted-foreground">
                          Este nivel no tiene profesores asignados
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
