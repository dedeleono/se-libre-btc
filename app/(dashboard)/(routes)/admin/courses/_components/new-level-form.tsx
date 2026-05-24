"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLevel } from "@/actions/level";
import { toast } from "sonner";
import { PlusCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function NewLevelDialog({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createLevel(name);
      toast.success("Nivel creado exitosamente");
      setOpen(false);
      setName("");
    } catch (error) {
      toast.error("Error al crear nivel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className={cn(
            "flex items-center gap-2 font-medium rounded-lg",
            className
          )}
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          Nuevo Grado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agrega un Nuevo Grado</DialogTitle>
          <DialogDescription>
            Ingresa el nombre del nuevo nivel educativo
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
            <Button type="submit" disabled={loading}>
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
