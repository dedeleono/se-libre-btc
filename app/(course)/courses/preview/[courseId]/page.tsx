import Image from "next/image";
import Link from "next/link";
import { differenceInMonths, format } from "date-fns";
import {
  Star,
  Clock,
  BarChart,
  Heart,
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  Video,
  FileIcon,
  Book,
  PenTool,
  CheckCircle,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import React from "react";
import Header from "@/components/layout/navbar-header-main";
import { cn } from "@/lib/utils";
import { Preview } from "@/components/preview";
import { IntroChapterLink } from "./_components/intro-chapter-link";

// Helper function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

// Helper function to get file type icon and style
const getFileType = (url: string) => {
  const extension = url.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "pdf";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "image";
    case "mp4":
    case "mov":
      return "video";
    default:
      return "document";
  }
};

// Helper function to get badge variant based on chapter type
const getBadgeVariant = (
  type: string
): "default" | "destructive" | "outline" | "secondary" => {
  switch (type) {
    case "QUIZ":
      return "secondary"; // Changed from 'warning'
    case "ASSIGNMENT":
      return "secondary";
    case "LESSON":
    default:
      return "default";
  }
};

// Component for chapter type icon
const ChapterIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "QUIZ":
      return <PenTool className="w-5 h-5 text-yellow-500" />;
    case "ASSIGNMENT":
      return <FileText className="w-5 h-5 text-orange-500" />;
    case "LESSON":
    default:
      return <Book className="w-5 h-5 text-emerald-500" />;
  }
};

// Component for file type icon
const FileIconComponent = ({
  type,
  className,
}: {
  type: string;
  className?: string;
}) => {
  switch (type) {
    case "pdf":
      return <FileText className={className} />;
    case "video":
      return <Video className={className} />;
    default:
      return <FileIcon className={className} />;
  }
};

// Helper to format duration
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default async function CourseLandingPage({
  params,
  searchParams,
}: {
  params: { courseId: string };
  searchParams: { from?: string; levelId?: string };
}) {
  // Enhanced Prisma query
  const course = await prisma.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      teacher: true,
      levelCourses: {
        include: {
          level: true,
        },
      },
      courseCategory: {
        include: {
          category: true,
        },
      },
      modules: {
        include: {
          chapters: {
            where: {
              isPublished: true,
            },
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              type: true,
              startTime: true,
              endTime: true,
              isIntro: true,
              assignments: {
                include: {
                  questions: true,
                },
              },
              attachments: true,
            },
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
      attachments: true,
      studentCourses: {
        include: {
          student: true,
        },
      },
    },
  });

  if (!course) {
    redirect("/");
  }

  // Calculate course statistics
  const courseStats = {
    enrolledStudents: course.studentCourses.length,
    totalModules: course.modules.length,
    totalChapters: course.modules.reduce(
      (acc, module) => acc + module.chapters.length,
      0
    ),
    totalAssignments: course.modules.reduce(
      (acc, module) =>
        acc +
        module.chapters.reduce(
          (sum, chapter) => sum + chapter.assignments.length,
          0
        ),
      0
    ),
    totalMaterials: course.attachments.length,
  };

  // Get schedule information from chapters
  const scheduleInfo = course.modules
    .flatMap((module) => module.chapters)
    .filter(
      (
        chapter
      ): chapter is typeof chapter & {
        startTime: Date;
        endTime: Date;
      } => {
        return chapter.startTime !== null && chapter.endTime !== null;
      }
    )
    .map((chapter) => ({
      title: chapter.title,
      startTime: chapter.startTime,
      endTime: chapter.endTime,
      type: chapter.type,
    }));

  // Get required materials from attachments
  const requiredMaterials = course.attachments.map((attachment) => ({
    name: attachment.name,
    url: attachment.url,
    type: getFileType(attachment.url),
  }));

  // Get levels this course is available for
  const availableLevels = course.levelCourses.map((lc) => ({
    name: lc.level.name,
    id: lc.level.id,
  }));

  // Get subject categories
  const subjects = course.courseCategory
    .map((cc) => cc.category?.name)
    .filter(Boolean);

  const backHref = searchParams.from === 'level' && searchParams.levelId 
    ? `/levels/${searchParams.levelId}`
    : "/courses";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 mb-8 text-sm text-gray-600 hover:text-gray-900 transition-colors group dark:text-white/70 dark:hover:text-white"
        >
          <div className="bg-white p-2 rounded-full shadow-sm group-hover:-translate-x-0.5 transition-transform dark:bg-white/[0.06]">
            <ChevronLeft className="w-4 h-4 dark:text-white/70" />
          </div>
          <span>
            {searchParams.from === "level"
              ? "Volver al Nivel"
              : "Volver a Cursos"}
          </span>
        </Link>

        {/* Course Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 text-emerald-600 font-medium mb-4 dark:text-emerald-400">
            {subjects.map((subject, index) => (
              <React.Fragment key={subject}>
                <span>{subject}</span>
                {index < subjects.length - 1 && <span>•</span>}
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-5xl font-black mb-6 text-primary dark:text-secondary font-['Open_Sans']">
            {course.title}
          </h1>
          <div className="text-xl text-gray-600 mb-6 max-w-3xl dark:text-white/70">
            {course.description && <Preview value={course.description} />}
          </div>

          {/* Course Stats */}
          <div className="flex items-center flex-wrap gap-6">
            {availableLevels.length > 0 && (
              <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-sm dark:bg-white/[0.06] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                <GraduationCap className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                <span className="dark:text-white/90">
                  {availableLevels.map((l) => l.name).join(", ")}
                </span>
              </div>
            )}
            <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-sm dark:bg-white/[0.06] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
              <Users className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              <span className="dark:text-white/90">
                {courseStats.enrolledStudents} estudiantes
              </span>
            </div>
            <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-sm dark:bg-white/[0.06] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
              <BookOpen className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              <span className="dark:text-white/90">
                {courseStats.totalModules} módulos
              </span>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Main Content Column */}
          <div className="md:col-span-2">
            {/* Course Preview */}
            <Card className="bg-white shadow-lg p-6 mb-8 dark:bg-black/40 dark:border-white/[0.05]">
              <div className="aspect-video bg-gray-900 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                {course.imageUrl ? (
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-xl hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-400 dark:text-white/50">
                      Preview coming soon
                    </span>
                  </div>
                )}
              </div>

              {/* Required Materials */}
              <div className="border-t pt-6 dark:border-white/[0.05]">
                <h3 className="text-lg font-semibold mb-4 dark:text-white/90">
                  Materiales de Apoyo
                </h3>
                <div className="space-y-3">
                  {requiredMaterials.map((material) => (
                    <div
                      key={material.url}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <FileIconComponent
                          type={material.type}
                          className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                        />
                        <span className="dark:text-white/90">
                          {material.name}
                        </span>
                      </div>
                      {/* <Button variant="ghost" size="sm" asChild className="dark:hover:bg-white/[0.06] dark:text-white/70">
                        <Link href={material.url}>Descargar</Link>
                      </Button> */}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Course Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Contenido del Curso</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm dark:bg-black/40 dark:border-white/[0.05]">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {courseStats.totalModules}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-white/70">
                        Unidades
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm dark:bg-black/40 dark:border-white/[0.05]">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {courseStats.totalChapters}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-white/70">
                        Lecciones
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm dark:bg-black/40 dark:border-white/[0.05]">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {courseStats.totalAssignments}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-white/70">
                        Tareas
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm dark:bg-black/40 dark:border-white/[0.05]">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {courseStats.totalMaterials}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-white/70">
                        Materiales de Apoyo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <Card
              className="bg-white shadow-lg p-8 hover:shadow-xl transition-all duration-300 border-2 border-emerald-50 
              dark:bg-black/40 dark:border-white/[0.05] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
            >
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h2
                      className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent
                      dark:from-emerald-400 dark:to-emerald-600"
                    >
                      Acceso al Curso
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-white/70">
                      Inscríbete ahora y obtén acceso completo a todos los
                      materiales del curso
                    </p>
                  </div>
                  <Link href={`/checkout`} className="block">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-emerald-200 transition-all duration-300 group">
                      <span className="mr-2 group-hover:scale-110 transition-transform duration-300">
                        Inscribirse Ahora
                      </span>
                      →
                    </Button>
                  </Link>
                </div>

                {/* Course Features */}
                <div className="space-y-6 pt-4 border-t border-emerald-100">
                  <h3 className="font-semibold text-lg dark:text-secondary text-gray-800">
                    Este curso incluye:
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-lg hover:bg-emerald-50 dark:bg-success/5 dark:hover:bg-success/10">
                      <BookOpen className="w-5 h-5 text-emerald-600 dark:text-success" />
                      <div>
                        <span className="font-semibold dark:text-white/90">
                          {courseStats.totalModules} unidades
                        </span>
                        <p className="text-xs text-gray-500 dark:text-white/70">
                          Contenido estructurado y organizado
                        </p>
                      </div>
                    </li>
                    <li className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-lg hover:bg-emerald-50 dark:bg-success/5 dark:hover:bg-success/10">
                      <FileText className="w-5 h-5 text-emerald-600 dark:text-success" />
                      <div>
                        <span className="font-semibold dark:text-white/90">
                          {courseStats.totalAssignments} tareas
                        </span>
                        <p className="text-xs text-gray-500 dark:text-white/70">
                          Ejercicios prácticos y evaluaciones
                        </p>
                      </div>
                    </li>
                    {/* {scheduleInfo.length > 0 && (
                      <li className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-lg hover:bg-emerald-50 dark:bg-success/5 dark:hover:bg-success/10">
                        <Clock className="w-5 h-5 text-emerald-600 dark:text-success" />
                        <div>
                          <span className="font-semibold dark:text-white/90">
                            {format(new Date(scheduleInfo[0].startTime), "PP")}{" "}
                            -{" "}
                            {format(
                              new Date(
                                scheduleInfo[scheduleInfo.length - 1].endTime
                              ),
                              "PP"
                            )}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-white/70">
                            Duración del curso
                          </p>
                        </div>
                      </li>
                    )} */}
                    {scheduleInfo.length > 0 && (
                      <li className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-lg hover:bg-emerald-50 dark:bg-success/5 dark:hover:bg-success/10">
                        <Clock className="w-5 h-5 text-emerald-600 dark:text-success" />
                        <div>
                          <span className="font-semibold dark:text-white/90">
                            {differenceInMonths(
                              new Date(
                                scheduleInfo[scheduleInfo.length - 1].endTime
                              ),
                              new Date(scheduleInfo[0].startTime)
                            )}{" "}
                            meses
                          </span>
                          <p className="text-xs text-gray-500 dark:text-white/70">
                            Duración del curso
                          </p>
                        </div>
                      </li>
                    )}
                    <li className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-lg hover:bg-emerald-50 dark:bg-success/5 dark:hover:bg-success/10">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-success" />
                      <div>
                        <span className="font-semibold dark:text-white/90">
                          Certificado de finalización
                        </span>
                        <p className="text-xs text-gray-500 dark:text-white/70">
                          Al completar todos los módulos
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Teacher Information */}
            {course.teacher && (
              <Card className="bg-white shadow-lg p-6 dark:bg-black/40 dark:border-white/[0.05]">
                <h2 className="text-xl font-bold mb-6 dark:text-white/90">
                  Profesor del Curso
                </h2>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={course.teacher.image || ""} />
                    <AvatarFallback className="dark:bg-white/[0.06]">
                      {getInitials(course.teacher.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold dark:text-white/90">
                      {course.teacher.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-white/70">
                      {course.teacher.role}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Level Requirements */}
            {availableLevels.length > 0 && (
              <Card className="bg-white shadow-lg p-6 dark:bg-black/40 dark:border-white/[0.05]">
                <h2 className="text-xl font-bold mb-6 dark:text-white/90">
                  Disponible para
                </h2>
                <div className="space-y-4">
                  {availableLevels.map((level) => (
                    <div
                      key={level.id}
                      className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg dark:bg-success/5"
                    >
                      <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-success" />
                      <span className="dark:text-white/90">{level.name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Modules Accordion */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-sky-100 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-sky-600" />
            </div>
            <h2 className="text-2xl font-bold">Unidades del Curso</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-6">
            {course.modules.map((module, moduleIndex) => (
              <AccordionItem
                key={module.id}
                value={module.id}
                className="border-2 border-emerald-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 dark:border-white/[0.05]"
              >
                <AccordionTrigger className="bg-white px-6 py-5 hover:bg-emerald-50/50 dark:bg-black/40 dark:hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-sky-100 text-sky-700 dark:bg-secondary/10 dark:text-secondary w-8 h-8 rounded-lg flex items-center justify-center font-semibold">
                          {moduleIndex + 1}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-white/90">
                          {module.title}
                        </span>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {module.chapters.length}{" "}
                        {module.chapters.length === 1
                          ? "capítulo"
                          : "capítulos"}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-white dark:bg-transparent px-6 py-4 border-t border-emerald-50 dark:border-white/[0.08] ">
                  <div className="space-y-3">
                    {module.chapters.map((chapter) => (
                      <div key={chapter.id}>
                        {chapter.isIntro ? (
                          <IntroChapterLink 
                            href={`/courses/${params.courseId}/chapters/${chapter.id}`}
                            chapterId={chapter.id}
                            className="block w-full"
                          >
                            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/50 transition-all duration-300 group">
                              <div className="flex items-center gap-3">
                                <ChapterIcon type={chapter.type} />
                                <span className="text-gray-700 group-hover:text-gray-900 transition-colors dark:text-white/90">
                                  {chapter.title}
                                  {chapter.isIntro && <span className="ml-2 text-sm text-emerald-600">(Preview)</span>}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {chapter.startTime ? (
                                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full group-hover:bg-gray-200 transition-colors">
                                    <Clock className="w-4 h-4" />
                                    <span>{format(new Date(chapter.startTime), "PP")}</span>
                                  </div>
                                ) : (
                                  <Badge
                                    variant={getBadgeVariant(chapter.type)}
                                    className="transition-transform group-hover:scale-105"
                                  >
                                    {chapter.type === "LESSON"
                                      ? "LECCIÓN"
                                      : chapter.type === "QUIZ"
                                      ? "CUESTIONARIO"
                                      : "TAREA"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </IntroChapterLink>
                        ) : (
                          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/50 transition-all duration-300 group">
                            <div className="flex items-center gap-3">
                              <ChapterIcon type={chapter.type} />
                              <span className="text-gray-700 group-hover:text-gray-900 transition-colors dark:text-white/90">
                                {chapter.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {chapter.startTime ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full group-hover:bg-gray-200 transition-colors">
                                  <Clock className="w-4 h-4" />
                                  <span>{format(new Date(chapter.startTime), "PP")}</span>
                                </div>
                              ) : (
                                <Badge
                                  variant={getBadgeVariant(chapter.type)}
                                  className="transition-transform group-hover:scale-105"
                                >
                                  {chapter.type === "LESSON"
                                    ? "LECCIÓN"
                                    : chapter.type === "QUIZ"
                                    ? "CUESTIONARIO"
                                    : "TAREA"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}