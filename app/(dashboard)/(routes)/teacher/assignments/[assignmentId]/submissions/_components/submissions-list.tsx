"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  Submission,
  User,
  SubmissionStatus,
  Assignment,
  Question,
  Answer,
  StudentAssignmentScore,
} from "@prisma/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { calculateTotalPoints } from "@/actions/score-calcs";

type SubmissionWithRelations = Submission & {
  student: User;
  assignment: Assignment & {
    questions: Question[];
    studentAssignmentScores: StudentAssignmentScore[];
  };
  answers: Answer[];
};

interface SubmissionsListProps {
  submissions: SubmissionWithRelations[];
  assignmentId: string;
}

export const SubmissionsList = ({
  submissions,
  assignmentId,
}: SubmissionsListProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const statusMap: Record<
    SubmissionStatus,
    {
      label: string;
      variant: "default" | "destructive" | "outline" | "secondary";
      className?: string;
    }
  > = {
    PENDING: {
      label: "Pendiente",
      variant: "secondary",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0",
    },
    SUBMITTED: {
      label: "Enviado",
      variant: "default",
      className: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-0",
    },
    GRADED: {
      label: "Calificado",
      variant: "secondary",
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-0",
    },
  };

  return (
    
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-700/10 dark:bg-slate-100/10 hover:bg-slate-50/70 dark:hover:bg-slate-900/70 transition-colors">
            <TableHead className="text-success font-bold dark:text-secondary/80 font-['Open_Sans']">
              Estudiante
            </TableHead>
            <TableHead className="text-success font-bold dark:text-secondary/80 font-['Open_Sans']">
              Estado
            </TableHead>
            <TableHead className="text-success font-bold dark:text-secondary font-['Open_Sans']">
              Enviado
            </TableHead>
            <TableHead className="text-success font-bold dark:text-secondary font-['Open_Sans']">
              Calificación
            </TableHead>
            <TableHead className="text-right font-semibold sr-only">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => {
            const totalPossiblePoints = calculateTotalPoints(submission.assignment);
            const percentage = submission.score
              ? (submission.score / totalPossiblePoints) * 100
              : 0;

            return (
              <TableRow
                key={submission.id}
                className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 
                      flex items-center justify-center text-primary font-semibold text-sm
                      group-hover:scale-105 transition-transform duration-200"
                    >
                      {submission.student.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 sm:text-sm text-xs text-nowrap">
                      {(submission.student.name?.length as number) > 10
                        ? submission.student.name?.slice(0, 10) + "..."
                        : submission.student.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusMap[submission.status].variant}
                    className={cn(
                      "font-medium",
                      statusMap[submission.status].className
                    )}
                  >
                    {statusMap[submission.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground dark:text-slate-400 sm:text-sm text-xs text-nowrap">
                  {submission.submittedAt &&
                    formatDistanceToNow(new Date(submission.submittedAt), {
                      addSuffix: true,
                    })}
                </TableCell>
                <TableCell>
                  {submission.status === "GRADED" ? (
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          percentage >= 70
                            ? "text-emerald-600 dark:text-emerald-400"
                            : percentage < 50
                              ? "text-red-600 dark:text-red-400"
                              : "text-slate-600 dark:text-slate-400"
                        )}
                      >
                        {submission.score?.toFixed(2) ?? 0}/
                        {totalPossiblePoints} pts
                      </span>
                      <span className="text-[10px] text-muted-foreground dark:text-slate-500 sm:block hidden">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground dark:text-slate-500">
                      -
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={() =>
                      router.push(
                        `/teacher/assignments/${assignmentId}/submissions/${submission.id}`
                      )
                    }
                    disabled={submission.status === "PENDING"}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600/90 dark:hover:bg-blue-600 
                      dark:text-white transition-colors sm:text-sm text-xs"
                  >
                    Calificar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {submissions.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground dark:text-slate-400 italic"
              >
                No hay tareas recibidas todavía
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    
  );
};
