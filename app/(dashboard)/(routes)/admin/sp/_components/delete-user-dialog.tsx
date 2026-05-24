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
import { Loader2 } from "lucide-react";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userType: "teacher" | "student";
  userName: string;
  onSuccess: () => void;
}

export const DeleteUserDialog = ({
  isOpen,
  onClose,
  userId,
  userType,
  userName,
  onSuccess,
}: DeleteUserDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/users/${userId}/soft-delete`);
      toast.success(`${userType === "teacher" ? "Profesor" : "Estudiante"} eliminado exitosamente`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(`Ocurrió un error al eliminar el ${userType === "teacher" ? "profesor" : "estudiante"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar {userType === "teacher" ? "Profesor" : "Estudiante"}</DialogTitle>
          <DialogDescription className="mt-2">
            ¿Estás seguro que deseas eliminar a {userName}?
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
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 