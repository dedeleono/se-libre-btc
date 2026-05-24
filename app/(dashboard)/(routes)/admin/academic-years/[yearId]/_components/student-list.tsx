"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AcademicStatus } from "@prisma/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

type StudentAcademicYear = {
  id: string;
  studentId: string;
  academicYearId: string;
  levelId: string;
  status: AcademicStatus;
  isPaid: boolean;
  finalGrade: number | null;
  createdAt: Date;
  updatedAt: Date;
  paymentId: string | null;
  student: {
    id: string;
    name: string | null;
    email: string | null;
    image?: string | null;
  };
  level: {
    id: string;
    name: string;
    position?: number;
    price?: number | null;
    inscriptionPrice?: number | null;
    inscriptionPaid?: boolean;
  };
  payment?: {
    id: string;
    amount: number;
    status: string;
    userEmail?: string;
  } | null;
};

interface StudentListProps {
  students: StudentAcademicYear[];
}

export const StudentList = ({ students }: StudentListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredStudents = students.filter(enrollment => {
    const student = enrollment.student;
    return (
      (student.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (student.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadge = (status: AcademicStatus) => {
    switch (status) {
      case AcademicStatus.ACTIVE:
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> Activo</Badge>;
      case AcademicStatus.COMPLETED:
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Aprobado</Badge>;
      case AcademicStatus.FAILED:
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Reprobado</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Buscar estudiante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estudiante</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Calificación</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  No hay estudiantes que coincidan con la búsqueda
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className="font-medium">{enrollment.student.name || "Sin nombre"}</div>
                    <div className="text-sm text-muted-foreground">{enrollment.student.email || "Sin email"}</div>
                  </TableCell>
                  <TableCell>
                    {enrollment.level.name}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(enrollment.status)}
                  </TableCell>
                  <TableCell>
                    {enrollment.finalGrade !== null
                      ? `${enrollment.finalGrade.toFixed(1)}/100`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {enrollment.isPaid ? (
                      <Badge className="bg-green-500">Pagado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-500">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/students/${enrollment.student.id}`}>
                      <Button size="sm" variant="ghost">
                        <ArrowUpRight className="h-4 w-4 mr-1" /> 
                        Ver
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 