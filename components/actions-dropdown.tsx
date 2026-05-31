"use client";

import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";
interface ActionProps {
  courseId: string;
}

export default function ActionsDropdown({
  courseId,
}: ActionProps) {
  const { t } = useLocale();
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditProduct = (courseId: string) => {
    router.push(`/admin/courses/${courseId}`);
  };

  const handleDeleteProduct = async (courseId: string) => {
    setIsDeleting(true);
    try {
      await axios.delete(`/api/courses/${courseId}`);
      toast.success(t.toasts.courseDeleted);
      router.refresh();
    } catch (error) {
      toast.error(t.toasts.courseDeleteError);
    } finally {
      setIsDeleting(false); // Stop loading
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button size="icon" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t.common.actions}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleEditProduct(courseId)}>
          {t.common.edit}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDeleteProduct(courseId)}>
          {t.common.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
