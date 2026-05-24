"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AssignTeacherButtonProps {
  teacherId: string;
  availableLevels: { id: string; name: string }[];
  className?: string;
  children?: React.ReactNode;
}

export function AssignTeacherButton({ 
  teacherId, 
  availableLevels, 
  className,
  children 
}: AssignTeacherButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const router = useRouter();

  const onAssignTeacher = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teachers/${teacherId}/level`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ levelId: selectedLevel }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign teacher");
      }

      toast.success("Profesor asignado exitosamente");
      router.refresh();
      setOpen(false);
    } catch (error) {
      toast.error("Error al asignar profesor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={className}
      >
        {children || (
          <div className="flex flex-col items-center gap-2">
            <UserPlus className="h-8 w-8" />
            <p className="font-semibold">Asignar a Nivel</p>
            <p className="text-sm text-muted-foreground">
              Añadir profesor a un nuevo nivel
            </p>
          </div>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar a Nivel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={selectedLevel}
              onValueChange={setSelectedLevel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nivel" />
              </SelectTrigger>
              <SelectContent>
                {availableLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={onAssignTeacher}
              disabled={!selectedLevel || loading}
              className="w-full"
            >
              Asignar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 