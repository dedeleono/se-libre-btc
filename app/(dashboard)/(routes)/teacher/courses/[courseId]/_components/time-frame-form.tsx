"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Pencil, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

interface TimeFrameFormProps {
  initialData: {
    courseStartDate: Date | null;
    courseEndDate: Date | null;
    lessonDuration: string | null;
  };
  courseId: string;
}

const formSchema = z.object({
  courseStartDate: z.date(),
  courseEndDate: z.date(),
  lessonDuration: z.enum(["daily", "weekly", "biweekly", "monthly"]),
}).refine((data) => data.courseEndDate > data.courseStartDate, {
  message: "La fecha de fin debe ser después de la fecha de inicio",
  path: ["courseEndDate"],
});

const durationOptions = [
  { label: "Diaria", value: "daily" },
  { label: "Semanal", value: "weekly" },
  { label: "Quincenal", value: "biweekly" },
  { label: "Mensual", value: "monthly" },
];

export const TimeFrameForm = ({
  initialData,
  courseId,
}: TimeFrameFormProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((current) => !current);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseStartDate: initialData.courseStartDate || new Date(),
      courseEndDate: initialData.courseEndDate || new Date(),
      lessonDuration: initialData.lessonDuration as "daily" | "weekly" | "biweekly" | "monthly" || "weekly",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Show loading toast
    const loadingToast = toast.loading("Updating course time frame...");
    
    try {
      await axios.patch(`/api/courses/${courseId}/time-frame`, values);
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Course time frame updated");
      toggleEdit();
      router.refresh();
    } catch {
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Duración del Curso
        <Button
          onClick={toggleEdit}
          variant="ghost"
          className="transition-all hover:scale-105"
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-y-4 mt-4"
        >
          <div className="flex items-center gap-x-2 text-sm">
            <CalendarIcon className="h-4 w-4" />
            <span>
              Fecha de Inicio:{" "}
              <span className="font-bold">
                {initialData.courseStartDate
                  ? format(new Date(initialData.courseStartDate), "PPP")
                  : "--"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-x-2 text-sm">
            <CalendarIcon className="h-4 w-4" />
            <span>
              Fecha de Fin:{" "}
              <span className="font-bold">
                {initialData.courseEndDate
                  ? format(new Date(initialData.courseEndDate), "PPP")
                  : "--"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-x-2 text-sm">
            <CalendarIcon className="h-4 w-4" />
            <span>
              Duración de las Lecciones:{" "}
              <span className="font-bold">
                {initialData.lessonDuration
                  ? durationOptions.find(
                      (opt) => opt.value === initialData.lessonDuration
                    )?.label
                  : "--"}
              </span>
            </span>
          </div>
        </motion.div>
      )}

      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 mt-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="courseStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal w-full transition-colors",
                                !field.value && "text-muted-foreground",
                                "hover:border-slate-300"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Elige una fecha de inicio</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courseEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal w-full transition-colors",
                                !field.value && "text-muted-foreground",
                                "hover:border-slate-300"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Elige una fecha de fin</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date <= form.getValues("courseStartDate") ||
                              date < new Date()
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="lessonDuration"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la duración de las lecciones" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Esta duración será usada para programar las lecciones y calcular las fechas de entrega de las tareas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-x-2">
                <Button
                  disabled={!isValid || isSubmitting}
                  type="submit"
                  className="transition-all hover:scale-105"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={toggleEdit}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      )}
    </div>
  );
}; 