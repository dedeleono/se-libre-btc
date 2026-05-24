"use client";

import { useEffect, useState } from "react";
import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const courseSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
  levelId: z.string().optional()
});

type CourseFormData = z.infer<typeof courseSchema>;

const CourseFormCreate = () => {
  const router = useRouter();
  const [levels, setLevels] = useState<{ id: string; name: string, position: number }[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(true);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      levelId: undefined,
    },
  });

  const { isSubmitting } = form.formState;

const onSubmit = async (values: CourseFormData) => {
  try {
    const response = await axios.post("/api/courses", values);
    router.push(`/teacher/courses/${response.data.id}`);
    toast.success("Curso creado");
  } catch (error) {
    toast.error("Algo salió mal");
  }
};

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setIsLoadingLevels(true);
        const response = await axios.get("/api/levels");
        setLevels(response.data);
      } catch (error) {
        toast.error("Error al cargar grados");
      } finally {
        setIsLoadingLevels(false);
      }
    };

    fetchLevels();
  }, []);

  return (
    <div className="md:max-w-3xl w-full mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="md:space-x-8 grid md:grid-cols-2 grid-cols-1 space-y-5 md:space-y-0 mt-8"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    disabled={isSubmitting}
                    placeholder="e.g. 'Matemáticas Avanzadas'"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="levelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grado</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un grado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))} */}
                    {[...levels]
                      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                      .map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selecciona el grado al que pertenece este curso
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-x-2 col-span-full justify-end pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Crear Curso
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CourseFormCreate;
