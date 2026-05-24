"use client";

import { User } from "@prisma/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { assignStudentToLevel } from "@/actions/level";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Users, MoreHorizontal, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StudentsListProps {
  levelId: string;
  students: User[];
  availableStudents?: {
    id: string;
    name: string | null;
    email: string;
  }[];
}

export function StudentsList({
  levelId,
  students,
  availableStudents
}: StudentsListProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

    const onAssignStudent = async (studentId: string) => {
      try {

        const response = await fetch(`/api/students/${studentId}/level`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ levelId }),
        });

        if (!response.ok) {
          throw new Error("Failed to assign student");
        }

        const data = await response.json();
        console.log("Assignment response:", data);

        toast.success("Estudiante asignado exitosamente");
        router.refresh();
        setOpen(false);
      } catch (error) {
        console.error("Error al asignar estudiante:", error);
        toast.error("Error al asignar estudiante");
      }
    };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total de estudiantes: {students.length}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Estudiante
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {availableStudents?.length === 0 ? (
              <DropdownMenuItem disabled>
                No hay estudiantes disponibles
              </DropdownMenuItem>
            ) : (
              availableStudents?.map((student) => (
                <DropdownMenuItem
                  key={student.id}
                  onClick={() => onAssignStudent(student.id)}
                >
                  {student.name || student.email}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No hay estudiantes asignados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
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
