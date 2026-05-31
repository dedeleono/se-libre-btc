"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { Loader2, Pencil, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Course, CourseModule } from "@prisma/client";
import { ModulesList } from "./modules-list";
import { toast } from "sonner";

interface ModulesFormProps {
  initialData: Course & { modules: CourseModule[] };
  courseId: string;
}

const formSchema = z.object({
  title: z.string().min(1),
});

export const ModulesForm = ({ initialData, courseId }: ModulesFormProps) => {
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleCreating = () => setIsCreating((prev) => !prev);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/courses/${courseId}/course-modules`, values);
      toast.success("Módulo creado");
      toggleCreating();
      router.refresh();
    } catch (error) {
      toast.error("Error al crear módulo");
    }
  };

  const onReorder = async (updateData: {id: string; position: number}[]) => {
    try {
      setIsUpdating(true)
      await axios.put(`/api/courses/${courseId}/course-modules/reorder`, {
        list: updateData
      })

      toast.success("Módulos reordenados");
      router.refresh()
      
    } catch (error) {
      toast.error("Error al reordenar módulos");
    } finally {
      setIsUpdating(false)
    }
  }

  const onEdit = (id: string) => {
    router.push(`/admin/courses/${courseId}/course-modules/${id}`)
  };

  return (
    <div className="relative mt-6 rounded-md border bg-card p-4 shadow-sm">
      {isUpdating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70 backdrop-blur-sm"><Loader2 className="animate-spin h-6 w-6 text-primary"/></div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">Módulos del curso</h3>
          <p className="text-xs text-muted-foreground">Organiza el contenido en bloques claros.</p>
        </div>
        <Button
          onClick={toggleCreating}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          {isCreating && <>Cancelar</>}
          {!isCreating && (
            <>
              <PlusCircle className="w-4 h-4 mr-2" />
              Agregar un módulo
            </>
          )}
        </Button>
      </div>

      {isCreating && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g 'Introducción al curso'"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button disabled={!isValid || isSubmitting} type="submit">
              Crear
            </Button>
          </form>
        </Form>
      )}
      {!isCreating && (
        <div
          className={cn(
            "text-sm mt-2",
            !initialData.modules.length && "text-slate-500 italic"
          )}
        >
          {!initialData.modules.length && "No hay módulos"}
          <ModulesList onEdit={onEdit} onReorder={onReorder} items={initialData.modules || []}/>
        </div>
      )}
      {!isCreating && (
        <p className="text-xs text-muted-foreground mt-4">
          Arrastra y suelta para reordenar.
        </p>
      )}
    </div>
  );
};
