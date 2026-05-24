import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, GraduationCap, ArrowUpRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface StudentCoursesTableProps {
  courses: any[];
}

export function StudentCoursesTable({ courses }: StudentCoursesTableProps) {
  return (
    <div
      className="max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)] overflow-x-auto rounded-2xl border bg-white/80 dark:bg-black/40
      shadow-[0_2px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_20px_-10px_rgba(0,0,0,0.3)]
      dark:border-white/[0.05]"
    >
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-0 font-['Open_Sans']">
            <TableHead
              className="h-12 font-black text-base text-muted-foreground/80 
              bg-accent/30 first:rounded-tl-2xl"
            >
              Curso
            </TableHead>
            <TableHead
              className="h-12 font-black text-base text-muted-foreground/80 
              bg-accent/30 first:rounded-tl-2xl"
            >
              Profesor
            </TableHead>
            <TableHead
              className="h-12 font-black text-base text-muted-foreground/80 
              bg-accent/30 first:rounded-tl-2xl"
            >
              Módulos
            </TableHead>
            <TableHead
              className="h-12 font-black text-base text-muted-foreground/80 
              bg-accent/30 first:rounded-tl-2xl"
            >
              Capítulos
            </TableHead>
            <TableHead
              className="h-12 font-black text-base text-muted-foreground/80 
                bg-accent/30 last:rounded-tr-2xl"
            >
              Estado
            </TableHead>
            <TableHead
              className="h-12 font-black text-base text-muted-foreground/80 
                bg-accent/30 last:rounded-tr-2xl max-w-[30px]"
            ></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((studentCourse) => (
            <TableRow
              key={studentCourse.courseId}
              className="hover:bg-accent/5 dark:hover:bg-accent/5 transition-colors"
            >
              <TableCell>
                <Link
                  href={`/course/${studentCourse.courseId}`}
                  className="font-medium text-foreground/90 sm:text-sm text-xs transition-colors flex items-center gap-2"
                >
                  <span>{studentCourse.course.title}</span>
                </Link>
              </TableCell>
              <TableCell className="font-medium text-foreground/90 sm:text-sm text-xs italic">
                {studentCourse.course.teacher?.name || "Sin asignar"}
              </TableCell>
              <TableCell className="sm:pl-10">
                {studentCourse.course.modules?.length || 0}
              </TableCell>
              <TableCell className="sm:pl-10">
                {studentCourse.course.modules?.reduce(
                  (acc: number, module: any) =>
                    acc + (module.chapters?.length || 0),
                  0
                ) || 0}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="dark:bg-secondary/10 dark:text-secondary dark:hover:bg-secondary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200"
                >
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full dark:bg-secondary bg-primary animate-pulse text-xs" />
                    En Progreso
                  </span>
                </Badge>
              </TableCell>
              <TableCell className="text-center max-w-[30px]">
                <Link
                  href={`/courses/${studentCourse.courseId}`}
                  className="dark:text-primary/80 dark:hover:text-primary dark:bg-primary/10 dark:hover:bg-primary/20 transition-colors duration-200 block p-2 rounded-md text-accent hover:text-success bg-success/10 hover:bg-success/20"
                >
                  <ExternalLink className="h-4 w-4 mx-auto" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 