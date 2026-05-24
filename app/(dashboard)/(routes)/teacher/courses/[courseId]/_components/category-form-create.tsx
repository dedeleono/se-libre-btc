"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
});

interface FormPros {
  courseId: string;
}

type CategoryFormData = z.infer<typeof categorySchema>;

const CategoryFormCreate = forwardRef(({ courseId }: FormPros, ref) => {
  const router = useRouter();

  const [creatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [modalOpen, setIsModalOpen] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
    },
  });

  const { isSubmitting } = form.formState;

  useImperativeHandle(ref, () => ({
    open: () => setIsModalOpen(true),
    close: () => setIsModalOpen(false),
  }));

  const onCreate = async (data: CategoryFormData) => {
    setIsCreatingNewCategory(true);
    try {
      const response = await axios.post(`/api/categories`, {
        categoryName: data.name,
      });

      if (response.status === 200) {
        toast.success("Categoría creada exitosamente");
        router.refresh();
        setIsCreatingNewCategory(false);
        setIsModalOpen(false);
      }
    } catch (error) {
      toast.error("Error al crear categoría");
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={(v) => setIsModalOpen(v)}>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>Nueva Categoría</DialogTitle>
          <DialogDescription>Escribe el nombre debajo</DialogDescription>
        </DialogHeader>

        {/* Use react-hook-form with Zod resolver */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Ej. Matemáticas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                variant="default"
                size="default"
                className="text-base"
                disabled={isSubmitting}
              >
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

CategoryFormCreate.displayName = "CategoryFormCreate";

export default CategoryFormCreate