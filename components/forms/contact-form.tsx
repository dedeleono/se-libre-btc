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
import { Send } from "lucide-react";
import { useLocale } from "@/lib/i18n";

type ContactFormValue = {
  name: string;
  email: string;
  message: string;
};

export default function ContactForm() {
  const { t } = useLocale();
  const contactFormSchema = z.object({
    name: z.string().min(1, { message: t.validation.nameRequired }),
    email: z.string().email({ message: t.validation.email }),
    message: z.string().min(1, { message: t.validation.messageRequired }),
  });

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
      // Add your contact send logic here
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  const labelClass =
    "text-xs font-extrabold uppercase tracking-[0.12em] text-foreground";

  return (
    <div className="stamp-card p-6 md:p-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>{t.forms.name}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.forms.namePlaceholder}
                      disabled={isPending}
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
                  <FormLabel className={labelClass}>{t.forms.email}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t.auth.emailPlaceholder}
                      disabled={isPending}
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
                <FormLabel className={labelClass}>{t.forms.message}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t.forms.messagePlaceholder}
                    disabled={isPending}
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={isPending} type="submit" className="w-full">
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isPending ? t.forms.sending : t.forms.sendMessage}
          </Button>
        </form>
      </Form>
    </div>
  );
}
