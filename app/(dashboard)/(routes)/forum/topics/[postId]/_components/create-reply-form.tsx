"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";

const formSchema = z.object({
  content: z.string().min(1, "Reply cannot be empty"),
});

interface CreateReplyFormProps {
  postId: string;
}

export function CreateReplyForm({ postId }: CreateReplyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await axios.post(`/api/forum/posts/${postId}/replies`, values);
      form.reset();
      toast.success("Reply posted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="reply-form">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Escribe tu respuesta..."
                  className="min-h-[100px] resize-none focus:ring-2 focus:ring-slate-200"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
