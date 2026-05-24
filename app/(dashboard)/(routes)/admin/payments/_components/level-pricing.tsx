"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { formatPrice } from "@/lib/utils";
import { Pencil, Save, Loader2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Level {
  id: string;
  name: string;
  price: number | null;
  inscriptionPrice: number | null;
  position: number;
}

interface LevelPricingProps {
  levels: Level[];
}

export function LevelPricing({ levels: initialLevels }: LevelPricingProps) {
  const [levels, setLevels] = useState(
    [...initialLevels].sort((a, b) => a.position - b.position)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async (level: Level) => {
    if (editingId === level.id) {
      try {
        setIsLoading(true);
        await axios.patch(`/api/levels/${level.id}/pricing`, {
          price: level.price,
          inscriptionPrice: level.inscriptionPrice,
        });
        setEditingId(null);
        toast.success("Precios actualizados correctamente");
      } catch (error) {
        toast.error("Error al actualizar los precios");
      } finally {
        setIsLoading(false);
      }
    } else {
      setEditingId(level.id);
    }
  };

  const updateLevel = (id: string, field: keyof Level, value: string) => {
    setLevels(levels.map(level => 
      level.id === id 
        ? { ...level, [field]: value === '' ? null : parseFloat(value) || 0 }
        : level
    ));
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="p-6 border-b bg-muted/40">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Precios por Grado
            </h2>
            <p className="text-sm text-muted-foreground sm:block hidden">
              Administra los precios de mensualidad e inscripción para cada
              grado
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <Table className="min-w-[550px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-auto text-primary font-bold">Grado</TableHead>
              <TableHead className="text-primary font-bold">Mensualidad</TableHead>
              <TableHead className="text-primary font-bold">Inscripción</TableHead>
              <TableHead className="text-primary font-bold text-right w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.map((level) => (
              <TableRow
                key={level.id}
                className={cn(
                  "transition-all duration-200",
                  editingId === level.id && "bg-muted/50"
                )}
              >
                <TableCell className="sm:text-sm text-xs">
                  <div className="font-medium text-nowrap">{level.name.length > 26 ? level.name.slice(0, 26) + "..." : level.name}</div>
                  {editingId === level.id && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Editando precios...
                    </div>
                  )}
                </TableCell>
                <TableCell className="sm:text-sm text-xs">
                  {editingId === level.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={level.price || 0}
                        onChange={(e) =>
                          updateLevel(level.id, "price", e.target.value)
                        }
                        className="max-w-[150px] h-8"
                        placeholder="0.00"
                      />
                      <span className="text-xs text-muted-foreground">GTQ</span>
                    </div>
                  ) : (
                    <div className="font-mono  bg-muted/30 w-fit px-2 py-0.5 rounded">
                      {formatPrice(level.price || 0)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="sm:text-sm text-xs">
                  {editingId === level.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={level.inscriptionPrice || 0}
                        onChange={(e) =>
                          updateLevel(
                            level.id,
                            "inscriptionPrice",
                            e.target.value
                          )
                        }
                        className="max-w-[150px] h-8"
                        placeholder="0.00"
                      />
                      <span className="text-xs text-muted-foreground">GTQ</span>
                    </div>
                  ) : (
                    <div className="font-mono  bg-muted/30 w-fit px-2 py-0.5 rounded">
                      {formatPrice(level.inscriptionPrice || 0)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={editingId === level.id ? "default" : "ghost"}
                    onClick={() => handleEdit(level)}
                    disabled={isLoading}
                    size="sm"
                    className={cn(
                      "h-8 px-3 transition-all",
                      editingId === level.id && "bg-primary hover:bg-primary/90"
                    )}
                  >
                    {isLoading && editingId === level.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingId === level.id ? (
                      <>
                        <Save className="h-3.5 w-3.5 mr-2" />
                        Guardar
                      </>
                    ) : (
                      <>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Editar
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
