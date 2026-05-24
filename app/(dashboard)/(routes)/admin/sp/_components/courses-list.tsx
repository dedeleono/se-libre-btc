"use client";

import { Course, LevelCourse } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { BookOpen, MoreHorizontal, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CoursesListProps {
  levelId: string;
  courses: (LevelCourse & {
    course: Course;
  })[];
  availableCourses: Course[];
  isLoading: boolean;
}

export function CoursesList({
  levelId,
  courses,
  availableCourses,
  isLoading
}: CoursesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 bg-muted/40 rounded-lg">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  function onAssignCourse(id: string): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total de cursos: {courses.length}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="sm" disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Curso
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {isLoading ? (
              <DropdownMenuItem disabled>
                Cargando cursos...
              </DropdownMenuItem>
            ) : availableCourses.length === 0 ? (
              <DropdownMenuItem disabled>
                No hay cursos disponibles
              </DropdownMenuItem>
            ) : (
              availableCourses.map((course) => (
                <DropdownMenuItem
                  key={course.id}
                  onClick={() => onAssignCourse(course.id)}
                >
                  {course.title}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No hay cursos asignados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map((levelCourse) => (
            <div
              key={levelCourse.id}
              className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{levelCourse.course.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {levelCourse.course.description || "Sin descripción"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
