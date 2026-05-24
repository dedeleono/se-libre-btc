"use client";

import { User, LevelTeacher } from "@prisma/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { assignTeacherToLevel } from "@/actions/level";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Users, MoreHorizontal, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeachersListProps {
  levelId: string;
  teachers: (LevelTeacher & {
    teacher: User;
  })[];
  availableTeachers?: {
    id: string;
    name: string | null;
    email: string;
  }[];
}

export function TeachersList({
  levelId,
  teachers,
  availableTeachers = []
}: TeachersListProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onAssignTeacher = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/teachers/${teacherId}/level`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ levelId }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign teacher");
      }

      toast.success("Profesor asignado exitosamente");
      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error("Error al asignar profesor:", error);
      toast.error("Error al asignar profesor");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total de profesores: {teachers.length}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Profesor
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {availableTeachers.length === 0 ? (
              <DropdownMenuItem disabled>
                No hay profesores disponibles
              </DropdownMenuItem>
            ) : (
              availableTeachers.map((teacher) => (
                <DropdownMenuItem
                  key={teacher.id}
                  onClick={() => onAssignTeacher(teacher.id)}
                >
                  {teacher.name || teacher.email}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {teachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No hay profesores asignados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {teachers.map((teacherLevel) => (
            <div
              key={teacherLevel.id}
              className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{teacherLevel.teacher.name}</p>
                  <p className="text-sm text-muted-foreground">{teacherLevel.teacher.email}</p>
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
