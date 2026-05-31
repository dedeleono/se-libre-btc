"use client";

import { useState } from "react";
import axios from "axios";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

interface ModuleActionsProps {
  courseId: string;
  moduleId: string;
}

export const ModuleActions = ({
  
  courseId,
  moduleId,
}: ModuleActionsProps) => {
  const { t } = useLocale();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const onDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(
        `/api/courses/${courseId}/course-modules/${moduleId}`
      );
      toast.success(t.admin.moduleDeleted);

      router.push(`/admin/courses/${courseId}`);

      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      toast.error(t.admin.moduleDeleteError);
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
