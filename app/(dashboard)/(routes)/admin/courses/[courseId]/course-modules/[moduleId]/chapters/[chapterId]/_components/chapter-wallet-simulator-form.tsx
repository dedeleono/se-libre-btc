"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Chapter } from "@prisma/client";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

interface ChapterWalletSimulatorFormProps {
  initialData: Chapter;
  courseId: string;
  moduleId: string;
  chapterId: string;
}

const formSchema = z.object({ hasWalletSimulator: z.boolean() });

export const ChapterWalletSimulatorForm = ({
  initialData,
  courseId,
  moduleId,
  chapterId,
}: ChapterWalletSimulatorFormProps) => {
  const { t } = useLocale();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => setIsEditing((prev) => !prev);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { hasWalletSimulator: !!initialData.hasWalletSimulator },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(
        `/api/courses/${courseId}/course-modules/${moduleId}/chapters/${chapterId}`,
        values
      );
      toast.success(t.admin.walletSimulatorUpdated);
      toggleEdit();
      router.refresh();
    } catch {
      toast.error(t.admin.walletSimulatorUpdateError);
    }
  };

  return (
    <div className="mt-6 bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        {t.admin.walletSimulator}
        <Button onClick={toggleEdit} variant="ghost" className="cursor-pointer">
          {isEditing && <>{t.common.cancel}</>}
          {!isEditing && (
            <>
              <Pencil className="w-4 h-4 mr-2" />
              {t.admin.editWalletSimulator}
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p className={cn("text-sm mt-2", !initialData.hasWalletSimulator && "text-slate-500 italic")}>
          {initialData.hasWalletSimulator ? t.admin.walletSimulatorOn : t.admin.walletSimulatorOff}
        </p>
      )}
      {isEditing && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="hasWalletSimulator"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormDescription>{t.admin.walletSimulatorHelp}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
