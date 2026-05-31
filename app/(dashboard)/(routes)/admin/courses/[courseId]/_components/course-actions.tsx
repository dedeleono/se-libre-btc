"use client";

import { useState } from "react";
import axios from "axios";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

interface ActionsProps {
  disabled: boolean;
  courseId: string;
  isPublished: boolean;
}

export const CourseActions = ({
  disabled,
  courseId,
  isPublished,
}: ActionsProps) => {
  const { t } = useLocale();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      if (isPublished) {
        await axios.patch(
          `/api/courses/${courseId}/unpublish`
        );
        toast.success(t.admin.courseUnpublished);
      } else {
        await axios.patch(
          `/api/courses/${courseId}/publish`
        );
        toast.success(t.admin.coursePublished);
      }

      router.refresh();
    } catch (error) {
      toast.error(t.common.somethingWentWrong);
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(
        `/api/courses/${courseId}`
      );
      toast.success(t.toasts.courseDeleted);
      router.refresh();
      router.push(`/admin/courses`);
    } catch (error) {
      toast.error(t.toasts.courseDeleteError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        size={"default"}
        variant={"outline"}
      >
        {isPublished ? t.admin.lower : t.admin.publish}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button size={"icon"} disabled={isLoading} variant={"destructive"}>
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};
