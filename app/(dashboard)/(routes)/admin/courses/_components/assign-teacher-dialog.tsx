import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
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

interface Teacher {
  id: string;
  name: string | null;
  email: string;
}

interface AssignTeacherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  teachers: Teacher[];
  onSuccess: () => void;
}

export function AssignTeacherDialog({
  isOpen,
  onClose,
  courseId,
  teachers,
  onSuccess,
}: AssignTeacherDialogProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/courses/${courseId}/teacher`, {
        teacherId: selectedTeacher,
      });
      toast.success("Profesor asignado correctamente");
      onSuccess();
      onClose();
    } catch {
      toast.error("Algo salió mal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Profesor</DialogTitle>
        </DialogHeader>
        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar profesor" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name || teacher.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-x-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isLoading || !selectedTeacher}>
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
