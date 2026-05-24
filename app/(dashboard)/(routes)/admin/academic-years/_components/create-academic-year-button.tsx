"use client";

import { useState, useEffect } from "react";
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
import { CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreateAcademicYearButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Set default start and end dates for a given year (Jan 1st and Dec 31st)
  useEffect(() => {
    // Check if name is a valid 4-digit year
    const yearRegex = /^\d{4}$/;
    if (yearRegex.test(name)) {
      const year = parseInt(name);
      // Only set dates if they're not already set or if the year changed
      if (!startDate || startDate.getFullYear() !== year) {
        setStartDate(new Date(`${year}-01-01`));
      }
      if (!endDate || endDate.getFullYear() !== year) {
        setEndDate(new Date(`${year}-12-31`));
      }
    }
  }, [name, startDate, endDate]);

  const onSubmit = async () => {
    if (!name || !startDate || !endDate) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    if (endDate < startDate) {
      toast.error("La fecha de fin debe ser posterior a la fecha de inicio");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/academic-year/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear el año académico");
      }

      toast.success("Año académico creado con éxito");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al crear el año académico");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Año Académico
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Año Académico</DialogTitle>
          <DialogDescription>
            Crea un nuevo año académico para la institución. Los años deben comenzar el 1 de enero y finalizar el 31 de diciembre.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre (Año)
            </Label>
            <Input
              id="name"
              placeholder="2027"
              className="col-span-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="col-span-4 text-xs text-muted-foreground ml-auto max-w-[75%]">
              Ingresa el año (ej. 2027). Las fechas de inicio y fin se establecerán automáticamente.
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Fecha de Inicio
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span>Seleccione una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              Fecha de Fin
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "PPP")
                    ) : (
                      <span>Seleccione una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) =>
                      startDate ? date < startDate : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={onSubmit} disabled={loading}>
            {loading ? "Creando..." : "Crear Año Académico"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 