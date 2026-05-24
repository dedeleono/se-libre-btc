import { useRef, forwardRef, useImperativeHandle, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeletePostModalProps {
  onConfirm: () => Promise<void>;
}

export type DeletePostModalRef = {
  open: () => void;
  close: () => void;
};

export const DeletePostModal = forwardRef<DeletePostModalRef, DeletePostModalProps>(
  ({ onConfirm }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }));

    const handleConfirm = async () => {
      try {
        setIsLoading(true);
        await onConfirm();
      } finally {
        setIsLoading(false);
        setIsOpen(false);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Post</DialogTitle>
            <DialogDescription>
              Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
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
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

DeletePostModal.displayName = "DeletePostModal"; 