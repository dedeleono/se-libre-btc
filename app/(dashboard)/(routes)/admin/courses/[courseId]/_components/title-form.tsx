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
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TitleFormProps {
  initialData: {
    title: string;
  };
  courseId: string;
}

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
});

export const TitleForm = ({ initialData, courseId }: TitleFormProps) => {
    const router = useRouter()

  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
        await axios.patch(`/api/courses/${courseId}`, values)
        toast.success("Nombre actualizado");
        toggleEdit()
        router.refresh()
    } catch (error) {
        toast.error("Error al actualizar nombre");
    }
  };

  return (
    <div className="mt-6 rounded-md border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">Nombre</h3>
          <p className="text-xs text-muted-foreground">El título público del curso.</p>
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
      {!isEditing && <p className="text-sm mt-2">{initialData.title}</p>}
      {isEditing && (
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
                      placeholder="Ej. Introducción a Bitcoin"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                Guardar
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
