"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { CalendarDays, Users, CheckCircle, XCircle, ArrowRight } from "lucide-react";

// Define the type for our data
export type YearSummary = {
  year: {
    id: string;
    name: string;
    startDate: Date | string;
    endDate: Date | string;
    isActive: boolean;
  };
  totalStudents: number;
  paidStudents: number;
  completedStudents: number;
  failedStudents: number;
  activeStudents: number;
  levelDistribution: Record<string, number>;
};

export const columns: ColumnDef<YearSummary>[] = [
  {
    accessorKey: "year.name",
    header: "Año Académico",
    cell: ({ row }) => {
      const year = row.original.year;
      return (
        <div className="flex flex-col">
          <div className="font-medium flex items-center">
            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
            {year.name}
            {year.isActive && (
              <Badge className="ml-2 bg-primary text-primary-foreground">
                Activo
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            1 ene - 31 dic {year.name}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "totalStudents",
    header: "Estudiantes",
    cell: ({ row }) => {
      const total = row.original.totalStudents;
      const active = row.original.activeStudents;
      const completed = row.original.completedStudents;
      const failed = row.original.failedStudents;
      
      return (
        <div className="flex flex-col">
          <div className="font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            {total} estudiantes
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex space-x-2">
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-blue-500 mr-1" />
              {active} activos
            </span>
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1" />
              {completed} aprobados
            </span>
            <span className="flex items-center">
              <span className="h-2 w-2 rounded-full bg-red-500 mr-1" />
              {failed} reprobados
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "paidStudents",
    header: "Pagos",
    cell: ({ row }) => {
      const paid = row.original.paidStudents;
      const total = row.original.totalStudents || 1; // Avoid division by zero
      const percentage = Math.round((paid / total) * 100);
      
      return (
        <div className="flex items-center">
          <div className="w-full bg-secondary rounded-full h-2 mr-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs font-medium">{percentage}%</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const year = row.original.year;
      
      return (
        <div className="flex justify-end">
          <Link href={`/admin/academic-years/${year.id}`}>
            <Button variant="ghost" size="sm">
              Detalles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      );
    },
  },
]; 