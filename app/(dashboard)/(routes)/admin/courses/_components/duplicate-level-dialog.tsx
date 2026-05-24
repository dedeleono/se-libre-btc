import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";

interface DuplicateLevelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  levelId: string;
  currentName: string;
  onSuccess: () => void;
}

export const DuplicateLevelDialog = ({
  isOpen,
  onClose,
  levelId,
  currentName,
  onSuccess,
}: DuplicateLevelDialogProps) => {
  const [name, setName] = useState(`${currentName} (Copia)`);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.post(`/api/levels/${levelId}/duplicate`, { name });
      toast.success("Nivel duplicado exitosamente");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Error al duplicar el nivel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar Nivel</DialogTitle>
          <DialogDescription>
            Ingresa el nombre para el nuevo nivel
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Cuarto Bachillerato"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              Duplicar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 