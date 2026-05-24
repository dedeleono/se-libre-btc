import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";
import { useState } from "react";

interface DeleteLevelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  levelId: string;
  hasStudents: boolean;
  onSuccess: () => void;
}

export const DeleteLevelDialog = ({
  isOpen,
  onClose,
  levelId,
  hasStudents,
  onSuccess,
}: DeleteLevelDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const onDelete = async () => {
    if (hasStudents) {
      toast.error("No se puede eliminar un grado con estudiantes asignados");
      onClose();
      return;
    }

    try {
      setIsLoading(true);
      await axios.delete(`/api/levels/${levelId}/delete`);
      toast.success("Grado eliminado exitosamente");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Ocurrió un error al eliminar el grado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-left">Eliminar Grado</DialogTitle>
          <DialogDescription className="text-left">
            {hasStudents 
              ? "No se puede eliminar un grado que tiene estudiantes asignados."
              : "¿Estás seguro de que deseas eliminar este grado? Esta acción no se puede deshacer."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isLoading || hasStudents}
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 