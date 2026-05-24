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
import { ArrowRightLeft, Check, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AcademicYear } from "@prisma/client";

interface RolloverYearButtonProps {
  currentYearId: string;
  nextYear?: {
    id: string;
    name: string;
    startDate: Date | string;
    endDate: Date | string;
    isActive: boolean;
  } | null;
}

export function RolloverYearButton({
  currentYearId,
  nextYear,
}: RolloverYearButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const onRollover = async () => {
    if (!nextYear) {
      toast.error("No hay un año académico siguiente disponible");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/academic-year/roll-over", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentAcademicYearId: currentYearId,
          newAcademicYearId: nextYear.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error en el avance de año");
      }

      const data = await response.json();
      setResults(data.results);
      toast.success("Avance de año completado con éxito");

      // Refresh after a short delay to let the user see the results
      setTimeout(() => {
        router.refresh();
        setOpen(false);
      }, 5000);
    } catch (error: any) {
      toast.error(error.message || "Error en el avance de año");
    } finally {
      setLoading(false);
    }
  };

  if (!nextYear) {
    return (
      <Button variant="outline" disabled>
        <ArrowRightLeft className="h-4 w-4 mr-2" />
        No hay año siguiente
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Avanzar Año
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Avance de Año Académico</DialogTitle>
          <DialogDescription>
            {results
              ? "Resultados del avance de año académico."
              : "Avanzar estudiantes al siguiente año académico. Esta acción calculará las calificaciones finales y determinará quienes aprueban o reprueban."}
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="py-4 space-y-4">
            <Alert>
              <AlertTitle>Avance completado</AlertTitle>
              <AlertDescription>
                Se procesaron {results.length} estudiantes. El año académico{" "}
                {nextYear.name} ahora está activo.
              </AlertDescription>
            </Alert>

            <div className="max-h-60 overflow-y-auto border rounded-md p-2">
              <div className="text-sm font-medium mb-2">Resultados:</div>
              {results.map((result, i) => (
                <div
                  key={i}
                  className="text-sm py-1 border-b last:border-0 flex justify-between"
                >
                  <span>{result.studentId.substring(0, 6)}...</span>
                  <div className="flex items-center">
                    <span className="mr-2">
                      {result.status === "PASSED" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </span>
                    <span>{result.finalGrade.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <Alert>
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                Esta acción:
                <ul className="list-disc pl-5 mt-2">
                  <li>Calculará calificaciones finales para el año actual</li>
                  <li>Determinará si los estudiantes aprueban o reprueban</li>
                  <li>Creará inscripciones para el año {nextYear.name}</li>
                  <li>Marcará {nextYear.name} como el año activo</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {!results && (
            <Button type="submit" onClick={onRollover} disabled={loading}>
              {loading ? "Procesando..." : "Iniciar Avance de Año"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}