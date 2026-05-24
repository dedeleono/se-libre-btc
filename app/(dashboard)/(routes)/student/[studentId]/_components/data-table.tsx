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
  studentId?: string;
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
  studentCourses,
  studentId
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
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Academic Overview Card */}
        <div className="flex-1 bg-card rounded-lg border shadow-sm p-6">
          <div className="space-y-1 mb-4">
            <h2 className="text-2xl font-semibold">Desempeño Académico</h2>
            <p className="text-sm text-muted-foreground">
              Vista general del rendimiento del estudiante
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Overall Average */}
            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
              <div className="p-2.5 bg-primary/10 rounded-full">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Promedio General</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary">{levelAverage}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
            </div>

            {/* Total Assignments */}
            <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-lg">
              <div className="p-2.5 bg-blue-100 rounded-full">
                <ScrollText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tareas</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-blue-600">
                    {Object.values(groupedAssignments).reduce(
                      (acc, course) => acc + course.assignments.length,
                      0
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">entregas</span>
                </div>
              </div>
            </div>

            {/* Courses Progress */}
            <div className="flex items-center gap-4 p-4 bg-green-50/50 rounded-lg">
              <div className="p-2.5 bg-green-100 rounded-full">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cursos Activos</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-green-600">
                    {studentCourses.length}
                  </span>
                  <span className="text-sm text-muted-foreground">cursos</span>
                </div>
              </div>
            </div>
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

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Tareas</h2>
            <p className="text-sm text-muted-foreground">
              Listado de tareas por curso
            </p>
          </div>
        </div>
        
        <div className="p-6">
          <Accordion type="multiple" className="w-full space-y-4">
            {Object.entries(groupedAssignments).map(([courseId, courseData]) => {
              const courseScores = calculateCourseScoreBreakdown(courseData.assignments);
              const filteredAssignments = courseData.assignments.filter((assignment: any) =>
                assignment.assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
              );

              return (
                <AccordionItem
                  key={courseId}
                  value={courseId}
                  className="border rounded-lg px-6"
                >
                  <AccordionTrigger className="hover:no-underline transition-all">
                    <div className="flex items-center justify-between flex-1 p-4">
                      <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-105">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>

                        <div className="flex flex-col gap-3">
                          <span className="font-semibold group-hover:text-primary transition-colors text-left w-full">
                            {courseData.courseTitle}
                          </span>

                          <div className="grid grid-cols-2 gap-8">
                            {/* Assignments Score */}
                            <div className="flex items-center gap-3">
                              <ScrollText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="text-xl font-semibold text-primary">
                                  {courseScores.assignmentsScore}
                                </span>
                                <span className="text-sm text-muted-foreground/60 ml-1">/70</span>
                              </div>
                            </div>

                            {/* Quiz Score */}
                            <div className="flex items-center gap-3">
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="text-xl font-semibold text-primary">
                                  {courseScores.quizScore}
                                </span>
                                <span className="text-sm text-muted-foreground/60 ml-1">/30</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "transition-all",
                          filteredAssignments.length > 0 
                            ? "bg-primary/10 text-primary hover:bg-primary/20" 
                            : ""
                        )}
                      >
                        {filteredAssignments.length} tareas
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-primary/70">Título</TableHead>
                            <TableHead className="font-semibold text-primary/70">Estado</TableHead>
                            <TableHead className="font-semibold text-primary/70">Calificación</TableHead>
                            <TableHead className="font-semibold text-primary/70 w-[50px]">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssignments.length === 0 ? (
                            <TableRow>
                              <TableCell 
                                colSpan={4} 
                                className="h-32 text-center text-muted-foreground"
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                    <ScrollText className="h-6 w-6 text-slate-400" />
                                  </div>
                                  <span>Aún no has enviado ninguna tarea</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredAssignments.map((submission: Submission) => {
                              return (
                                <TableRow
                                  key={submission.id}
                                  className="group transition-colors hover:bg-muted/50"
                                >
                                  <TableCell className="py-4">
                                    <div className="flex flex-col">
                                      <span className="font-medium group-hover:text-primary transition-colors">
                                        {submission.assignment.title}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        submission.status === "GRADED"
                                          ? "default"
                                          : submission.status === "SUBMITTED"
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
                                      ) : submission.status === "SUBMITTED" ? (
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
                                      <div className="flex flex-col gap-2">
                                        <div className="flex flex-col">
                                          <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-semibold text-primary">
                                              {submission.score.toFixed(1)}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                              /{submission.assignment.maxPoints}
                                              pts
                                            </span>
                                          </div>
                                        </div>
                                        <div
                                          className={cn(
                                            "h-1.5 w-full max-w-[120px] rounded-full bg-muted overflow-hidden",
                                            "transition-all duration-500 ease-in-out"
                                          )}
                                        >
                                          <div
                                            className={cn(
                                              "h-full rounded-full transition-all duration-500",
                                              submission.score &&
                                                submission.assignment.maxPoints &&
                                                ((submission.score / submission.assignment.maxPoints) * 100 >= 70)
                                                  ? "bg-green-500"
                                                  : submission.score &&
                                                    submission.assignment.maxPoints &&
                                                    ((submission.score / submission.assignment.maxPoints) * 100 >= 40)
                                                  ? "bg-yellow-500"
                                                  : "bg-red-500"
                                            )}
                                            style={{
                                              width: submission.score && submission.assignment.maxPoints
                                                ? `${(submission.score / submission.assignment.maxPoints) * 100}%`
                                                : "0%"
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground italic">
                                        Sin calificar
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Link
                                      href={`/student/portfolio/${submission.id}${
                                        studentId ? `?studentId=${studentId}` : ''
                                      }`}
                                      className="flex items-center justify-center hover:text-primary transition-all duration-200 hover:scale-110"
                                    >
                                      <ArrowUpRight className="h-5 w-5" />
                                    </Link>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
