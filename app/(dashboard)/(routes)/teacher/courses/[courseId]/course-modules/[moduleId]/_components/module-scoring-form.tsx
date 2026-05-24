"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Chapter, Assignment } from "@prisma/client";
import { Loader2, Percent, Calculator, Pencil, ChevronRight, AlertTriangle, ClipboardList, Check, GraduationCap } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const formSchema = z.object({
  assignmentsWeight: z.number().min(0).max(100)
});

interface ModuleScoringFormProps {
  moduleId: string;
  courseId: string;
  chapters: (Chapter & {
    assignments: Assignment[];
  })[];
  initialAssignmentsWeight?: number;
}

export const ModuleScoringForm = ({
  moduleId,
  courseId,
  chapters,
  initialAssignmentsWeight,
}: ModuleScoringFormProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingScores, setIsLoadingScores] = useState(true);
  const [currentScores, setCurrentScores] = useState<{
    assignmentsWeight: number;
    quizWeight: number;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignmentsWeight: initialAssignmentsWeight || 0
    }
  });

  useEffect(() => {
    const fetchCurrentScores = async () => {
      try {
        setIsLoadingScores(true);
        const firstAssignment = chapters
          .find(c => c.assignments.length > 0)
          ?.assignments[0];

        if (!firstAssignment) {
          setIsLoadingScores(false);
          return;
        }

        const response = await axios.get(`/api/assignments/${firstAssignment.id}/module-scoring`);
        setCurrentScores(response.data);
        form.setValue("assignmentsWeight", response.data.assignmentsWeight);
      } catch (error) {
        console.error("Error fetching scores:", error);
        toast.error("Error al cargar las puntuaciones");
      } finally {
        setIsLoadingScores(false);
      }
    };

    fetchCurrentScores();
  }, [chapters, form]);

  const assignments = chapters
    .filter(chapter => chapter.type === "ASSIGNMENT")
    .map(chapter => chapter.assignments[0]);
  
  const quiz = chapters
    .find(chapter => chapter.type === "QUIZ")
    ?.assignments[0];

  const hasMinimumRequirements = assignments.length >= 5 && quiz;

  const toggleEdit = () => {
    if (!hasMinimumRequirements) {
      toast.error("Se requieren mínimo 5 tareas y 1 quiz para configurar la puntuación");
      return;
    }
    setIsEditing((prev) => !prev);
  };

  const { isSubmitting, isValid } = form.formState;

  const assignmentsWeight = form.watch("assignmentsWeight");
  const quizWeight = assignmentsWeight ? 100 - assignmentsWeight : 0;

  const isScoringConfigured = currentScores !== null || form.watch("assignmentsWeight") > 0;

  const calculateIndividualAssignmentPoints = () => {
    if (assignments.length === 0) return 0;
    return Math.round((form.watch("assignmentsWeight") / assignments.length) * 10) / 10;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const response = await axios.patch(`/api/courses/${courseId}/course-modules/${moduleId}/scoring`, {
        assignmentsWeight: values.assignmentsWeight,
        quizWeight: quizWeight,
      });
      
      // Update local state with new values
      setCurrentScores({
        assignmentsWeight: values.assignmentsWeight,
        quizWeight: quizWeight
      });
      
      toast.success("Puntuación actualizada");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Algo salió mal");
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasMinimumRequirements) {
    return (
      <div className="mt-6 bg-slate-100 rounded-md p-4">
        <div className="font-medium flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <Calculator className="h-4 w-4 text-slate-500" />
            <span className="text-base font-medium">Distribución de Puntos</span>
          </div>
        </div>

        <div className="mt-4 bg-gradient-to-br from-amber-50/50 to-white rounded-lg border border-amber-200/50 shadow-sm">
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-x-4">
              <div className="min-w-fit">
                <div className="p-3 bg-amber-100/50 rounded-xl border border-amber-200/30 shadow-sm">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-amber-800">
                  Requisitos no cumplidos
                </h3>
                <p className="text-sm text-amber-700">
                  Para configurar la puntuación del módulo necesitas cumplir con los siguientes requisitos:
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  assignments.length >= 5 
                    ? "bg-green-50/50 border-green-200/50" 
                    : "bg-white border-amber-200/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-x-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      assignments.length >= 5 
                        ? "bg-green-100/50" 
                        : "bg-amber-100/50"
                    )}>
                      <ClipboardList className={cn(
                        "h-5 w-5",
                        assignments.length >= 5 
                          ? "text-green-600" 
                          : "text-amber-600"
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium",
                        assignments.length >= 5 
                          ? "text-green-700" 
                          : "text-amber-700"
                      )}>
                        Mínimo 5 tareas
                      </p>
                      <p className="text-sm text-slate-500">
                        {assignments.length} de 5 tareas creadas
                      </p>
                    </div>
                  </div>
                  {assignments.length >= 5 ? (
                    <div className="h-8 w-8 bg-green-100/50 rounded-full flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 bg-amber-100/50 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-amber-600">
                        {assignments.length}/5
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  quiz 
                    ? "bg-green-50/50 border-green-200/50" 
                    : "bg-white border-amber-200/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-x-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      quiz 
                        ? "bg-green-100/50" 
                        : "bg-amber-100/50"
                    )}>
                      <GraduationCap className={cn(
                        "h-5 w-5",
                        quiz 
                          ? "text-green-600" 
                          : "text-amber-600"
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium",
                        quiz 
                          ? "text-green-700" 
                          : "text-amber-700"
                      )}>
                        Quiz final
                      </p>
                      <p className="text-sm text-slate-500">
                        {quiz ? "Quiz creado" : "Quiz pendiente"}
                      </p>
                    </div>
                  </div>
                  {quiz ? (
                    <div className="h-8 w-8 bg-green-100/50 rounded-full flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 bg-amber-100/50 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-amber-600">
                        0/1
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <span className="text-base font-medium text-nowrap">Distribución de Puntos</span>
        </div>
        {!hasMinimumRequirements && (
          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
            Agrega un mínimo 5 tareas y 1 quiz
          </div>
        )}
        <Button
          onClick={toggleEdit}
          variant="ghost"
          className={cn(
            "cursor-pointer transition-all",
            isEditing && "bg-slate-200",
            !hasMinimumRequirements && "opacity-50 hidden"
          )}
        >
          {isEditing ? (
            <span className="text-slate-600">Cancelar</span>
          ) : (
            <span className="flex items-center gap-x-2 text-slate-700">
              <Pencil className="w-4 h-4" />
              Editar Puntuación
            </span>
          )}
        </Button>
      </div>

      {!isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-6"
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-col gap-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">
                      Tareas
                    </span>
                    <div className="flex items-baseline gap-x-1">
                      {isLoadingScores ? (
                        <div className="h-9 w-24 animate-pulse bg-slate-100 rounded" />
                      ) : (
                        <>
                          <span className="text-3xl font-semibold text-slate-900">
                            {isScoringConfigured 
                              ? (currentScores?.assignmentsWeight ?? form.watch("assignmentsWeight")) 
                              : '-'}
                          </span>
                          <span className="text-slate-500 text-lg">puntos</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-y-1">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "bg-emerald-50 text-emerald-700 border-emerald-200/50 text-nowrap",
                        isLoadingScores && "opacity-50"
                      )}
                    >
                      {assignments.length} tareas
                    </Badge>
                  </div>
                </div>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  {isLoadingScores ? (
                    <div className="h-full w-full bg-slate-200 animate-pulse" />
                  ) : (
                    <div
                      className="h-full bg-emerald-500/20 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${isScoringConfigured 
                          ? (currentScores?.assignmentsWeight ?? form.watch("assignmentsWeight")) 
                          : 0}%` 
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-col gap-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">
                      Parcial
                    </span>
                    <div className="flex items-baseline gap-x-1">
                      {isLoadingScores ? (
                        <div className="h-9 w-24 animate-pulse bg-slate-100 rounded" />
                      ) : (
                        <>
                          <span className="text-3xl font-semibold text-slate-900">
                            {isScoringConfigured 
                              ? (currentScores?.quizWeight ?? quizWeight) 
                              : '-'}
                          </span>
                          <span className="text-slate-500 text-lg">puntos</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-y-1">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "bg-orange-50 text-orange-700 border-orange-200/50",
                        isLoadingScores && "opacity-50"
                      )}
                    >
                      Quiz
                    </Badge>
                  </div>
                </div>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  {isLoadingScores ? (
                    <div className="h-full w-full bg-slate-200 animate-pulse" />
                  ) : (
                    <div
                      className="h-full bg-orange-500/20 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${isScoringConfigured 
                          ? (currentScores?.quizWeight ?? quizWeight) 
                          : 0}%` 
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="scoring-breakdown" className="border-none">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 transition-colors rounded-t-lg">
                  <div className="flex items-center gap-x-2">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Calculator className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex flex-col items-start">
                      <h3 className="text-sm font-medium text-slate-700">
                        Desglose
                      </h3>
                      {isLoadingScores ? (
                        <div className="h-4 w-32 animate-pulse bg-slate-100 rounded" />
                      ) : (
                        <p className="text-xs text-slate-500">
                          {assignments.length} tareas, 1 quiz • {
                            ((currentScores?.assignmentsWeight ?? form.watch("assignmentsWeight")) + 
                            (currentScores?.quizWeight ?? quizWeight)) || 0
                          } puntos totales
                        </p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className="divide-y divide-slate-100">
                    {assignments.map((assignment, index) => (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-x-3">
                          <div className="h-8 w-8 rounded-full bg-sky-50 flex items-center justify-center">
                            <span className="text-sm font-medium text-sky-600">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-700">
                              Tarea {index + 1}
                            </span>
                            <span className="text-xs text-slate-500">
                              Evaluación Individual
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-x-2">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                            {calculateIndividualAssignmentPoints()} pts
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                    {quiz && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: assignments.length * 0.1 }}
                        className="flex items-center justify-between p-4 hover:bg-orange-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-x-3">
                          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-600">
                              Q
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-700">Quiz Final</span>
                            <span className="text-xs text-slate-500">
                              Evaluación Parcial
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-x-2">
                          <Badge variant="secondary" className="bg-orange-50 text-orange-700">
                            {currentScores?.quizWeight ?? quizWeight} pts
                          </Badge>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </AccordionContent>
              </div>
            </AccordionItem>
          </Accordion>
        </motion.div>
      )}

      {isEditing && (
        <Form {...form}>
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6"
          >
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
              <div className="flex items-center gap-x-2 pb-4 border-b border-slate-100">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <Percent className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-700">
                    Ajustar Distribución
                  </h3>
                  <p className="text-xs text-slate-500">
                    El punteo del parcial se ajustará automáticamente
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="assignmentsWeight"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <FormLabel className="text-sm text-slate-600">
                          Punteo Total de Tareas
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => {
                                const value = Math.min(100, Math.max(0, parseInt(e.target.value)));
                                field.onChange(value);
                              }}
                              placeholder="0-100"
                              className={cn(
                                "bg-white pr-8 text-lg font-medium transition-all",
                                "border-slate-200 focus:border-slate-300 focus:ring-slate-200/50",
                                "placeholder:text-slate-300"
                              )}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                              pts
                            </span>
                          </div>
                        </FormControl>
                      </div>

                      <div className="space-y-2">
                        <FormLabel className="text-sm text-slate-600">
                          Punteo Total de Parcial
                        </FormLabel>
                        <div className="relative">
                          <div className="h-10 bg-slate-50 rounded-md border border-slate-200 flex items-center px-3">
                            <span className="text-lg font-medium text-slate-700">
                              {quizWeight}
                            </span>
                            <span className="text-slate-400 ml-1">pts</span>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="absolute -top-2 right-0 bg-teal-50 text-teal-700 text-[10px]"
                          >
                            Automático
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end gap-x-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-600 hover:text-slate-700"
                >
                  Cancelar
                </Button>
                <Button
                  disabled={!isValid || isSubmitting}
                  type="submit"
                  className={cn(
                    "bg-slate-900 hover:bg-slate-800",
                    "text-white transition-all",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </div>
            </div>
          </motion.form>
        </Form>
      )}
    </div>
  );
}; 