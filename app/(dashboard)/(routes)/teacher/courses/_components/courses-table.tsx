"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, FolderIcon, MoreHorizontal, PencilIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRouter } from "next/navigation";
import { ExtendedCourse } from "@/types/course";
import Image from "next/image";
import { Level } from "@prisma/client";
import { GradientDivider } from "@/components/gradient-divider";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

// Reusable components
const CourseTableHeader = () => (
  <TableHeader className="bg-muted/50">
    <TableRow>
      <TableHead className="font-semibold">Nombre</TableHead>
      <TableHead className="font-semibold">Profesor</TableHead>
      <TableHead className="font-semibold">Estudiantes</TableHead>
      <TableHead className="w-[70px]"></TableHead>
    </TableRow>
  </TableHeader>
);

interface CourseRowProps {
  course: ExtendedCourse;
}

const CourseRow = ({ course }: CourseRowProps) => {
  const router = useRouter();

  const getTotalStudents = (course: ExtendedCourse): number => {
    // Get unique student IDs from direct assignments
    const directStudentIds = new Set(
      course.studentCourses.map((sc) => sc.studentId)
    );

    // Add student IDs from level assignments
    course.levelCourses?.forEach((lc) => {
      lc.level.students?.forEach((student) => {
        directStudentIds.add(student.id);
      });
    });

    return directStudentIds.size;
  };

  return (
    <TableRow key={course.id} className="hover:bg-muted/50 transition-colors">
      <TableCell className="font-medium text-nowrap sm:text-sm text-xs ">{course.title}</TableCell>
      <TableCell>
        {course.teacher ? (
          <div className="flex items-center gap-2">
            {course.teacher.image && (
              <Image
                src={course.teacher.image}
                alt={course.teacher.name || ""}
                className="h-6 w-6 rounded-full"
                width={24}
                height={24}
              />
            )}
            <span>{course.teacher.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground italic text-nowrap sm:text-sm text-xs">Sin profesor</span>
        )}
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full sm:text-sm text-xs bg-muted text-nowrap ">
          {getTotalStudents(course)} <span className="sm:inline-block hidden">estudiantes</span>
        </span>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/courses/${course.id}`)}
              className="gap-2 sm:text-sm text-xs"
            >
              <Eye className="h-4 w-4" /> Ver detalles
            </DropdownMenuItem>
            {/* {course.isOwnCourse && ( */}
              <DropdownMenuItem
                onClick={() => router.push(`/teacher/courses/${course.id}`)}
                className="gap-2 sm:text-sm text-xs"
              >
                <PencilIcon className="h-4 w-4" /> Editar curso
              </DropdownMenuItem>
            {/* )} */}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

interface CoursesTableProps {
  initialData: (Level & {
    levelCourses: {
      course: ExtendedCourse;
    }[];
  })[];
  unassignedCourses: ExtendedCourse[];
}

export function CoursesTable({
  initialData,
  unassignedCourses,
}: CoursesTableProps) {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h2 className="text-xl tracking-tight text-success font-['Open_Sans'] font-black dark:text-secondary">
              Cursos por grado
            </h2>
            <p className="text-sm text-muted-foreground sm:block hidden">
              Listado de cursos organizados por grado académico
            </p>
          </div>
        </div>

        <Accordion type="multiple" className="w-full space-y-4">
          {initialData.map((level) => (
            <AccordionItem
              key={level.id}
              value={level.id}
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
                    <span className="font-semibold sm:text-sm text-xs text-left ">
                      {level.name.length > 12
                        ? level.name.slice(0, 12) + "..."
                        : level.name}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/15 text-nowrap sm:text-sm text-xs"
                  >
                    {level.levelCourses.length} cursos
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="max-w-[calc(100vw-3rem)] overflow-x-auto rounded-xl border bg-background">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-sm text-primary font-black">
                          Título
                        </TableHead>
                        <TableHead className="text-sm text-primary font-black">
                          Profesor
                        </TableHead>
                        <TableHead className="text-sm text-primary font-black">
                          Estudiantes
                        </TableHead>
                        <TableHead className="text-sm"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {level.levelCourses.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-24 text-center sm:text-sm text-xs"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <FolderIcon className="h-8 w-8 text-muted-foreground/50" />
                              <span className="text-muted-foreground">
                                No hay cursos asignados a este grado
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        level.levelCourses.map(({ course }) => (
                          <CourseRow key={course.id} course={course} />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <GradientDivider className="block sm:hidden" />
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-['Open_Sans'] font-black tracking-tight text-success dark:text-secondary">
              Cursos sin asignar
            </h2>

            <p className="text-sm text-muted-foreground sm:block hidden">
              Estos cursos aún no están asignados a ningún grado
            </p>
          </div>
        </div>

        <div
          className="max-w-[calc(100vw-3rem)] overflow-x-auto rounded-xl border bg-background 
          shadow-sm hover:shadow-md transition-all duration-300"
        >
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm text-primary font-black">
                  Título
                </TableHead>
                <TableHead className="text-sm text-primary font-black">
                  Profesor
                </TableHead>
                <TableHead className="text-sm text-primary font-black">
                  Estudiantes
                </TableHead>
                <TableHead className="text-sm"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unassignedCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FolderIcon className="h-8 w-8 text-muted-foreground/50" />
                      <span className="text-muted-foreground">
                        No hay cursos sin asignar
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                unassignedCourses.map((course) => (
                  <CourseRow key={course.id} course={course} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
