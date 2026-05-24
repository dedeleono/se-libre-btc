"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  PlusCircle,
  Users,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Level, User, LevelTeacher, LevelCourse, Course } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StudentsList } from "./student-list";
import { TeachersList } from "./teacher-list";
import { CoursesList } from "./courses-list";
import React from "react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface StudentScore {
  score: number;
  submittedAt: Date;
}

interface Student {
  id: string;
  name: string | null;
  email: string;
  assignmentScores: StudentScore[];
  studentLevel: {
    name: string;
  } | null;
  payments?: {
    status: "PAID" | "PENDING" | "FAILED";
    amount: number;
    createdAt: Date;
  }[];
}

interface StudentsDataTableProps {
  data: Student[];
}

const calculateAverageScore = (scores: StudentScore[]): number => {
  if (!scores.length) return 0;
  const total = scores.reduce((acc, score) => acc + score.score, 0);
  return Math.round((total / scores.length) * 10) / 10;
};

export function StudentsDataTable({ data }: StudentsDataTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Calificación Promedio</TableHead>
            <TableHead>Estado de Pagos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">
                {student.name || "Sin nombre"}
              </TableCell>
              <TableCell>{student.email}</TableCell>
              <TableCell>
                {calculateAverageScore(student.assignmentScores)}%
              </TableCell>
              <TableCell>
                {student.payments?.length ? (
                  <div className="flex gap-2">
                    {student.payments.some(p => p.status === "PENDING") && (
                      <Badge variant="secondary">Pendiente</Badge>
                    )}
                    {student.payments.some(p => p.status === "PAID") && (
                      <Badge variant="default">Pagado</Badge>
                    )}
                    {student.payments.some(p => p.status === "FAILED") && (
                      <Badge variant="destructive">Fallido</Badge>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline">Sin pagos</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
