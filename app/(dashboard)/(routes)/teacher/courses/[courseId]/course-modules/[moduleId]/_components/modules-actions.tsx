"use client";

import { useState } from "react";
import axios from "axios";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { validateChapterForPublishing } from "@/lib/validations/chapter";
import { toast } from "sonner";

interface ModuleActionsProps {
  courseId: string;
  moduleId: string;
}

export const ModuleActions = ({
  
  courseId,
  moduleId,
}: ModuleActionsProps) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(
        `/api/courses/${courseId}/course-modules/${moduleId}`
      );
      toast.success("Módulo eliminado");

      router.push(`/teacher/courses/${courseId}/course-modules/${moduleId}`);

      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      toast.error("Error al eliminar módulo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <ConfirmModal onConfirm={onDelete}>
        <Button size={"icon"} disabled={isLoading} variant={"destructive"}>
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};
