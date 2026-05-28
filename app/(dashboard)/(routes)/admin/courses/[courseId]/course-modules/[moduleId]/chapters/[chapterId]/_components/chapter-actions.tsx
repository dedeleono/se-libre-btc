"use client";

import { useState } from "react";
import axios from "axios";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { validateChapterForPublishing } from "@/lib/validations/chapter";
import { toast } from "sonner";

interface ChapterActionsProps {
  disabled: boolean;
  courseId: string;
  moduleId: string;
  chapterId: string;
  isPublished: boolean;
}

export const ChapterActions = ({
  disabled,
  courseId,
  moduleId,
  chapterId,
  isPublished,
}: ChapterActionsProps) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);

      if (!isPublished) {
        const chapterResponse = await axios.get(
          `/api/courses/${courseId}/course-modules/${moduleId}/chapters/${chapterId}`
        );
        const chapterData = chapterResponse.data;

        const validation = validateChapterForPublishing(chapterData);

        if (!validation.isValid) {
          toast.error(validation.message);
          return;
        }
      }

      const url = isPublished ? "unpublish" : "publish";
      await axios.patch(
        `/api/courses/${courseId}/course-modules/${moduleId}/chapters/${chapterId}/${url}`
      );

      toast.success(isPublished ? "Lección despublicada" : "Lección publicada");
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data || "Algo salió mal");
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(
        `/api/courses/${courseId}/course-modules/${moduleId}/chapters/${chapterId}`
      );
      toast.success("Lección eliminada");

      router.push(`/admin/courses/${courseId}/course-modules/${moduleId}`);
      
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      toast.error("Error al eliminar lección");
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
        {isPublished ? "Bajar" : "Publicar"}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button size={"icon"} disabled={isLoading} variant={"destructive"}>
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};
