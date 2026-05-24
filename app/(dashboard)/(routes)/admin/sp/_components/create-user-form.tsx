"use client";

import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { UserRole, Level } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const userSchema = z.object({
  email: z.string().email({
    message: "Email inválido",
  }),
  name: z.string().min(1, {
    message: "Nombre es requerido",
  }),
  lastName: z.string().min(1, {
    message: "Apellido es requerido",
  }),
  role: z.enum([UserRole.STUDENT, UserRole.TEACHER]),
  phone: z.string().optional(),
  levelId: z.string().optional(),
});

export interface UserFormRef {
  open: () => void;
  close: () => void;
}

type UserFormData = z.infer<typeof userSchema>;

const UserFormCreate = forwardRef<UserFormRef>((props, ref) => {
  const router = useRouter();
  const [levels, setLevels] = useState<Level[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await axios.get("/api/levels");
        setLevels(response.data);
      } catch (error) {
        console.error("Error fetching levels:", error);
      }
    };
    fetchLevels();
  }, []);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      name: "",
      lastName: "",
      role: UserRole.STUDENT,
      phone: "",
      levelId: "",
    },
  });

  const { isSubmitting: isFormSubmitting } = form.formState;
  const selectedRole = form.watch("role");

  useImperativeHandle(ref, () => ({
    open: () => setIsModalOpen(true),
    close: () => setIsModalOpen(false),
  }));

  const onCreate = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `/api/dashboard/admin/users/create`,
        data
      );

      if (response.status === 200) {
        toast.success("Invitación enviada correctamente");
        router.push("/admin/sp");
        setIsSubmitting(false);
        setIsModalOpen(false);
        form.reset();
      }
    } catch (error) {
      console.error("Error sending invitation: ", error);
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        toast.error(error.response.data.error || "Error al enviar invitación");
      } else {
        toast.error("Error al enviar invitación");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={(v) => setIsModalOpen(v)}>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>Nuevo Usuario</DialogTitle>
          <DialogDescription>Escribe el nombre debajo</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Ej. Diego" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de usuario</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.STUDENT}>
                        Estudiante
                      </SelectItem>
                      <SelectItem value={UserRole.TEACHER}>Profesor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedRole === UserRole.STUDENT && (
              <FormField
                control={form.control}
                name="levelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar nivel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="email@ejemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="Apellido"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="Teléfono"
                      {...field}
                    />
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

UserFormCreate.displayName = "UserFormCreate";

export default UserFormCreate;
