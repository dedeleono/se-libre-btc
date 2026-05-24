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
import { Chapter, Course, CourseModule, ChapterType } from "@prisma/client";
import { ChapterList } from "./chapters-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ChaptersFormProps {
  initialData: CourseModule & {chapters: Chapter[]};
  courseId: string;
  moduleId: string
}

const formSchema = z.object({
  title: z.string().min(1),
  type: z.nativeEnum(ChapterType),
});

export const ChaptersForm = ({ initialData, courseId, moduleId }: ChaptersFormProps) => {
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleCreating = () => setIsCreating((prev) => !prev);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: ChapterType.LESSON,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const position = initialData.chapters.length;
      
      await axios.post(
        `/api/courses/${courseId}/course-modules/${moduleId}/chapters`, 
        {
          ...values,
          position
        }
      );
      toast.success("Lección creada");
      toggleCreating();
      router.refresh();
    } catch (error) {
      toast.error("Error al crear lección");
    }
  };

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(
        `/api/courses/${courseId}/course-modules/${moduleId}/chapters/reorder`,
        {
          list: updateData,
        }
      );

      toast.success("Lecciones reordenadas");
      router.refresh();
    } catch (error) {
      toast.error("Error al reordenar lecciones");
    } finally {
      setIsUpdating(false);
    }
  };

  const onEdit = (id: string) => {
    return router.push(`/teacher/courses/${courseId}/course-modules/${moduleId}/chapters/${id}`);
  };

  return (
    <div className="mt-6 bg-slate-100 rounded-md p-4 relative">
      {isUpdating && (
        <div className="absolute h-full w-full bg-slate-500/20 top-0 right-0 rounded-md flex items-center justify-center">
          <Loader2 className="animate-spin h-6 w-6 text-sky-700" />
        </div>
      )}
      <div className="font-medium flex items-center justify-between">
        Lecciones del Módulo
        <Button
          onClick={toggleCreating}
          variant="ghost"
          className="cursor-pointer"
        >
          {isCreating && <>Cancelar</>}
          {!isCreating && (
            <>
              <PlusCircle className="w-4 h-4 mr-2" />
              Agregar una lección
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select chapter type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ChapterType.LESSON}>
                            Lección
                          </SelectItem>
                          <SelectItem value={ChapterType.QUIZ}>Quiz</SelectItem>
                          <SelectItem value={ChapterType.ASSIGNMENT}>
                            Tarea
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        className="bg-white border-black"
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
            !initialData.chapters.length && "text-slate-500 italic"
          )}
        >
          {!initialData.chapters.length && "No hay lecciones"}
          <ChapterList
            onEdit={onEdit}
            onReorder={onReorder}
            items={initialData.chapters || []}
          />
        </div>
      )}
      {!isCreating && (
        <p className="text-xs text-muted-foreground mt-4">
          Arratsra y suelta para re-ordenar{" "}
        </p>
      )}
    </div>
  );
};
