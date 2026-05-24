"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen, ArrowUpRight, ExternalLink, ScrollText, ChevronDown, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Submission {
  id: string;
  status: "PENDING" | "SUBMITTED" | "GRADED";
  score: number | null;
  assignment: {
    id: string;
    title: string;
    maxPoints: number | null;
    chapter: {
      type: "LESSON" | "QUIZ" | "ASSIGNMENT";
      module: {
        course: {
          id: string;
          title: string;
        };
      };
    };
  };
}

interface StudentCourse {
  id: string;
  title: string;
  submissions: Submission[];
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  studentCourses: StudentCourse[];
}

interface CourseScoreBreakdown {
  assignmentsScore: number;
  quizScore: number;
  totalScore: number;
}

const calculateCourseScoreBreakdown = (submissions: Submission[]): CourseScoreBreakdown => {
  const assignments = submissions.filter(s => s.assignment.chapter.type === "ASSIGNMENT");
  const quiz = submissions.find(s => s.assignment.chapter.type === "QUIZ");

  // Sum up actual assignment scores (max 70)
  const assignmentsScore = assignments.reduce((sum, s) => sum + (s.score || 0), 0);
  
  // Get quiz score (max 30)
  const quizScore = quiz?.score || 0;

  return {
    assignmentsScore: Math.round(assignmentsScore * 10) / 10,
    quizScore: Math.round(quizScore * 10) / 10,
    totalScore: Math.round((assignmentsScore + quizScore) * 10) / 10
  };
};

const groupAssignmentsByCourse = (data: Submission[], studentCourses: StudentCourse[]) => {
  const groupedData: Record<string, { courseTitle: string; assignments: Submission[] }> = {};
  
  studentCourses.forEach((course) => {
    groupedData[course.id] = {
      courseTitle: course.title,
      assignments: []
    };
  });

  data.forEach((submission) => {
    const courseId = submission.assignment.chapter.module.course.id;
    if (groupedData[courseId]) {
      groupedData[courseId].assignments.push(submission);
    }
  });

  return groupedData;
};

// Add level score calculation
const calculateLevelAverage = (courses: { submissions: Submission[] }[]): number => {
  if (courses.length === 0) return 0;
  
  const courseScores = courses.map(course => {
    const scores = calculateCourseScoreBreakdown(course.submissions);
    return scores.totalScore; // Each course is already out of 100
  });
  
  // Calculate average (sum of scores divided by number of courses)
  const average = courseScores.reduce((acc, score) => acc + score, 0) / courses.length;
  
  return Math.round(average * 10) / 10;
};

export function DataTable<TData, TValue>({ 
  columns, 
  data,
  studentCourses 
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const groupedAssignments = React.useMemo(() => {
    return groupAssignmentsByCourse(data as Submission[], studentCourses);
  }, [data, studentCourses]);

  const levelAverage = calculateLevelAverage(studentCourses.map(course => ({ submissions: course.submissions })));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-card to-card/50 p-6 rounded-lg shadow-sm">
        <div className="space-y-1 font-['Open_Sans']">
          <h2 className="text-4xl font-black bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Mi Portafolio
          </h2>
          <p className="text-sm text-muted-foreground sm:block hidden">
            Revisa todas tus tareas y evaluaciones enviadas
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 p-4 sm:p-5 bg-card/50 dark:bg-slate-900/50 rounded-lg border dark:border-slate-700">
          <div className="flex items-center sm:flex-col gap-4 sm:gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="bg-accent/10 dark:bg-accent/5 rounded-full p-1.5 sm:p-1">
                <GraduationCap className="h-6 w-6 sm:h-5 sm:w-5 text-accent dark:text-accent/70" />
              </div>
              <h3 className="font-medium text-base sm:text-sm text-muted-foreground dark:text-slate-400">
                Promedio
              </h3>
            </div>
            <div className="flex items-baseline gap-2 ml-auto sm:ml-0">
              <span className="text-4xl sm:text-3xl font-bold text-primary dark:text-primary/90">
                {levelAverage}
              </span>
              <div className="flex flex-col text-sm text-muted-foreground dark:text-slate-400">
                <span>/ 100</span>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "h-16 w-16 sm:h-14 sm:w-14 rounded-full border-[3px] sm:border-2 flex items-center justify-center shrink-0",
              levelAverage >= 70
                ? "border-green-500 text-green-500 dark:border-green-400 dark:text-green-400"
                : levelAverage >= 40
                  ? "border-yellow-500 text-yellow-500 dark:border-yellow-400 dark:text-yellow-400"
                  : "border-red-500 text-red-500 dark:border-red-400 dark:text-red-400"
            )}
          >
            <span className="text-xl sm:text-lg font-bold">
              {Math.round(levelAverage)}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar tareas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-xl bg-card">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Mis Tareas
            </h2>
            <p className="text-sm text-muted-foreground sm:block hidden">
              Listado de tareas por curso
            </p>
          </div>
        </div>

        <div className="p-6">
          <Accordion type="multiple" className="w-full space-y-4">
            {Object.entries(groupedAssignments).map(
              ([courseId, courseData]) => {
                const courseScores = calculateCourseScoreBreakdown(
                  courseData.assignments
                );
                const filteredAssignments = courseData.assignments.filter(
                  (assignment: any) =>
                    assignment.assignment.title
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                );

                return (
                  <AccordionItem
                    key={courseId}
                    value={courseId}
                    className="border dark:border-slate-700/50 rounded-lg px-6 dark:bg-slate-900/50"
                  >
                    <AccordionTrigger className="hover:no-underline transition-all">
                      <div className="flex items-center justify-between flex-1 sm:p-4 p-0">
                        <div className="flex items-center gap-6">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 dark:bg-primary/5 flex items-center justify-center transition-transform group-hover:scale-105">
                            <BookOpen className="h-6 w-6 text-primary dark:text-primary/70" />
                          </div>

                          <div className="flex flex-col gap-3">
                            <span className="font-semibold group-hover:text-primary transition-colors text-left w-full dark:text-slate-200">
                              {courseData.courseTitle}
                            </span>

                            <div className="grid grid-cols-2 gap-8">
                              {/* Assignments Score */}
                              <div className="flex items-center gap-3">
                                <ScrollText className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
                                <div>
                                  <span className="text-xl font-semibold text-accent dark:text-primary/90">
                                    {courseScores.assignmentsScore}
                                  </span>
                                  <span className="text-sm text-muted-foreground/60 dark:text-slate-500 ml-1">
                                    /70
                                  </span>
                                </div>
                              </div>

                              {/* Quiz Score */}
                              <div className="flex items-center gap-3">
                                <GraduationCap className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
                                <div>
                                  <span className="text-xl font-semibold text-accent dark:text-primary/90">
                                    {courseScores.quizScore}
                                  </span>
                                  <span className="text-sm text-muted-foreground/60 dark:text-slate-500 ml-1">
                                    /30
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant="secondary"
                          className={cn(
                            "transition-all sm:inline-block hidden",
                            filteredAssignments.length > 0
                              ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/90"
                              : ""
                          )}
                        >
                          {filteredAssignments.length} tareas
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="rounded-md border dark:border-slate-700/50">
                        <Table className="min-w-[600px]">
                          <TableHeader>
                            <TableRow className="hover:bg-transparent dark:border-slate-700/50">
                              <TableHead className="font-black text-sm text-primary/80 dark:text-slate-300">
                                Título
                              </TableHead>
                              <TableHead className="font-black text-sm text-primary/80 dark:text-slate-300">
                                Estado
                              </TableHead>
                              <TableHead className="font-black text-sm text-primary/80 dark:text-slate-300">
                                Calificación
                              </TableHead>
                              <TableHead className="font-semibold text-primary/70 dark:text-slate-300 w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAssignments.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className="h-32 text-center text-muted-foreground dark:text-slate-400"
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                      <ScrollText className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <span>
                                      Aún no has enviado ninguna tarea
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredAssignments.map(
                                (submission: Submission) => {
                                  return (
                                    <TableRow
                                      key={submission.id}
                                      className="group transition-colors hover:bg-muted/50 dark:hover:bg-slate-800/50 dark:border-slate-700/50"
                                    >
                                      <TableCell className="py-4">
                                        <div className="flex flex-col">
                                          <span className="font-medium group-hover:text-primary transition-colors sm:text-sm text-xs text-nowrap dark:text-slate-200">
                                            {submission.assignment.title}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={
                                            submission.status === "GRADED"
                                              ? "default"
                                              : submission.status ===
                                                  "SUBMITTED"
                                                ? "secondary"
                                                : "outline"
                                          }
                                          className="transition-all duration-200"
                                        >
                                          {submission.status === "GRADED" ? (
                                            <span className="flex items-center gap-1">
                                              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                              Completado
                                            </span>
                                          ) : submission.status ===
                                            "SUBMITTED" ? (
                                            <span className="flex items-center gap-1">
                                              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                              Enviado
                                            </span>
                                          ) : (
                                            <span className="flex items-center gap-1">
                                              <span className="h-2 w-2 rounded-full bg-gray-400" />
                                              Pendiente
                                            </span>
                                          )}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {submission.score !== null ? (
                                          <div className="flex flex-col gap-2 ">
                                            <div className="flex flex-col">
                                              <div className="flex items-baseline gap-1">
                                                <span className="sm:text-lg text-base font-semibold text-primary dark:text-primary/90">
                                                  {submission.score.toFixed(1)}
                                                </span>
                                                <span className="sm:text-sm text-xs text-muted-foreground dark:text-slate-400">
                                                  /
                                                  {
                                                    submission.assignment
                                                      .maxPoints
                                                  }
                                                  pts
                                                </span>
                                              </div>
                                            </div>
                                            <div
                                              className={cn(
                                                "sm:h-1.5 h-[2px] w-full max-w-[120px] rounded-full bg-muted overflow-hidden",
                                                "transition-all duration-500 ease-in-out"
                                              )}
                                            >
                                              <div
                                                className={cn(
                                                  "h-full rounded-full transition-all duration-500",
                                                  submission.score &&
                                                    submission.assignment
                                                      .maxPoints &&
                                                    (submission.score /
                                                      submission.assignment
                                                        .maxPoints) *
                                                      100 >=
                                                      70
                                                    ? "bg-green-500"
                                                    : submission.score &&
                                                        submission.assignment
                                                          .maxPoints &&
                                                        (submission.score /
                                                          submission.assignment
                                                            .maxPoints) *
                                                          100 >=
                                                          40
                                                      ? "bg-yellow-500"
                                                      : "bg-red-500"
                                                )}
                                                style={{
                                                  width:
                                                    submission.score &&
                                                    submission.assignment
                                                      .maxPoints
                                                      ? `${(submission.score / submission.assignment.maxPoints) * 100}%`
                                                      : "0%",
                                                }}
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground dark:text-slate-400 italic">
                                            Sin calificar
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Link
                                          href={`/student/portfolio/${submission.id}`}
                                          className={cn(
                                            "text-muted-foreground hover:text-primary transition-colors duration-200",
                                            "block p-2 rounded-full hover:bg-primary/10"
                                          )}
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </Link>
                                      </TableCell>
                                    </TableRow>
                                  );
                                }
                              )
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              }
            )}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
