"use client";

import * as z from "zod";
import { useRef } from "react";
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

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Course, CourseCategory } from "@prisma/client";
import Combobox from "@/components/ui/combobox";
import CategoryFormCreate from "./category-form-create";
import { toast } from "sonner";

interface CategoryFormProps {
  initialData: Course & {categories: CourseCategory[]};
  courseId: string;
  options: { label: string; value: string }[];
}

const formSchema = z.object({
  categoryIds: z.array(z.string().min(1)), // Expecting an array of strings (category IDs)
});

export const CategoryForm = ({
  initialData,
  courseId,
  options,
}: CategoryFormProps) => {
  const router = useRouter();

  const formCategoryCreateRef = useRef<{ open: () => void; close: () => void }>(
    null
  );

  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryIds: initialData.categories.map((category) =>
        category.categoryId?.toString()
      ), // Map category IDs to strings
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}/course-categories`, {
        courseId,
        categoryIds: values.categoryIds
      });
      toast.success("Categorías actualizadas");
      toggleEdit();
      router.refresh();
    } catch (error) {
      toast.error("Error al actualizar categorías");
    }
  };

  const selectedOptions = options.filter((option) =>
    form.getValues("categoryIds").includes(option.value.toString())
  );

  return (
    <div className="mt-6 rounded-md border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">Categorías</h3>
          <p className="text-xs text-muted-foreground">Ayudan a filtrar y descubrir este curso.</p>
        </div>
        <Button onClick={toggleEdit} variant="ghost" size="sm" className="shrink-0">
          {isEditing && <>Cancelar</>}
          {!isEditing && (
            <>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p
          className={cn(
            "text-sm mt-2",
            initialData.categories.length === 0 && "text-slate-500 italic"
          )}
        >
          {selectedOptions.length > 0
            ? selectedOptions.map((option) => option.label).join(", ")
            : "Sin categorías"}
        </p>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Combobox multiple options={options} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                Guardar
              </Button>
              <Button
                type="button"
                variant={"outline"}
                onClick={() => formCategoryCreateRef.current?.open()}
              >
                Nueva Categoría
              </Button>
            </div>
          </form>
        </Form>
      )}
      <CategoryFormCreate ref={formCategoryCreateRef} courseId={courseId} />
    </div>
  );
};
