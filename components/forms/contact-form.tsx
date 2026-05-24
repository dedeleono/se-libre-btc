"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Mail, Send, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const contactFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Enter a valid email address" }),
  message: z.string().min(1, { message: "Message is required" }),
});

type ContactFormValue = z.infer<typeof contactFormSchema>;

export default function ContactForm() {
  const router = useRouter();

  const form = useForm<ContactFormValue>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const isPending = form.formState.isSubmitting;

  const onSubmit = async (data: ContactFormValue) => {
    // @todo add endpoint to submit contact form
    try {
      // Add your submission logic here
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-black/40 dark:border-white/[0.05]">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-sky-900 dark:text-white/90">
                      Nombre
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="¿Cuál es tu nombre?"
                        disabled={isPending}
                        className="dark:bg-white/[0.06] dark:border-white/[0.05] dark:placeholder:text-white/50 dark:text-white/90"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-sky-900 dark:text-white/90">
                      Correo
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Ingresa tu correo"
                        disabled={isPending}
                        className="dark:bg-white/[0.06] dark:border-white/[0.05] dark:placeholder:text-white/50 dark:text-white/90"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-sky-900 dark:text-white/90">
                    Tu mensaje
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escribe tu mensaje aquí..."
                      disabled={isPending}
                      className="min-h-[120px] resize-none dark:bg-white/[0.06] dark:border-white/[0.05] dark:placeholder:text-white/50 dark:text-white/90"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={isPending}
              type="submit"
              className="w-full bg-sky-900 hover:bg-sky-800 dark:bg-sky-900/90 dark:hover:bg-sky-800/90"
            >
              {isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isPending ? "Enviando..." : "Enviar mensaje"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
