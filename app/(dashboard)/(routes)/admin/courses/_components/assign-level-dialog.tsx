"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";

interface Level {
  id: string;
  name: string;
}

interface AssignLevelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  levels: Level[];
  onSuccess: () => void;
}

export const AssignLevelDialog = ({
  isOpen,
  onClose,
  courseId,
  levels,
  onSuccess,
}: AssignLevelDialogProps) => {
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/courses/${courseId}/level`, {
        levelId: selectedLevel,
      });
      toast.success("Curso asignado exitosamente");
      onSuccess();
      onClose();
    } catch {
      toast.error("Ocurrió un error al asignar el curso");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar curso a un grado</DialogTitle>
        </DialogHeader>
        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar grado" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={!selectedLevel || isLoading}>
            Asignar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
