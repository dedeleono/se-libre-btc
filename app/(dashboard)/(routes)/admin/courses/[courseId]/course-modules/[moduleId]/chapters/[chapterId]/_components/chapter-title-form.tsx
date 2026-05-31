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
import { useLocale } from "@/lib/i18n";

interface ChapterTitleFormProps {
  initialData: {
    title: string;
  };
  courseId: string;
  moduleId: string;
  chapterId: string;
}

const formSchema = z.object({
  title: z.string().min(1),
});

export const ChapterTitleForm = ({
  initialData,
  courseId,
  moduleId,
  chapterId,
}: ChapterTitleFormProps) => {
  const { t } = useLocale();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((prev) => !prev);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(
        `/api/courses/${courseId}/course-modules/${moduleId}/chapters/${chapterId}`,
        values
      );
      toast.success(t.admin.titleUpdated);
      toggleEdit();
      router.refresh();
    } catch (error) {
        toast.error(t.admin.titleUpdateError);
    }
  };

  return (
    <div className="mt-6 bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        {t.admin.lessonName}
        <Button onClick={toggleEdit} variant="ghost" className="cursor-pointer">
          {isEditing && <>{t.common.cancel}</>}
          {!isEditing && (
            <>
              <Pencil className="w-4 h-4 mr-2" />
              {t.admin.editLessonName}
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
                      placeholder={t.admin.moduleTitlePlaceholderSpecific}
                      {...field}
                      className="bg-white border-black border-2"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                {t.common.save}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
