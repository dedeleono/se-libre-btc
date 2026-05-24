"use client";

import * as React from "react";
import {
  ColumnDef,
} from "@tanstack/react-table";
import { BookOpen, ScrollText } from "lucide-react";

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
  data,
  studentCourses,
}: DataTableProps<TData, TValue>) {

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

      
    </div>
  );
}
