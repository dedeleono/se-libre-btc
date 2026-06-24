"use client";

import { usePathname, useRouter } from "next/navigation";
import { Lock, CheckCircle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

interface CourseSidebarItemProps {
  id: string;
  label: string;
  isCompleted?: boolean;
  courseId: string;
  isLocked: boolean;
  type: string;
  startTime?: Date | null;
  endTime?: Date | null;
  currentUserRole?: string | null;
  isAccessible?: boolean;
  customMessage?: string;
}

export const CourseSidebarItem = ({
  id,
  label,
  isCompleted,
  courseId,
  isLocked,
  type,
  currentUserRole,
  isAccessible,
  customMessage
}: CourseSidebarItemProps) => {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname?.includes(id);

  const onClick = () => {
    if (!isAccessible) {
      toast.error(customMessage || t.course.completePreviousToast);
      return;
    }
    router.push(`/courses/${courseId}/chapters/${id}`);
  };

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "my-1 flex w-full items-center gap-x-3 rounded-[2px] px-3 py-4 text-left text-sm font-bold text-muted-foreground",
        "hover:bg-secondary hover:text-foreground",
        "transition-colors duration-200",
        isActive && 
          "border-2 border-foreground bg-foreground text-background hover:bg-foreground hover:text-background dark:bg-primary dark:text-primary-foreground",
        !isAccessible && "opacity-60"
      )}
    >
      {!isAccessible && currentUserRole === "STUDENT" ? (
        <Lock className="h-5 w-5" />
      ) : isCompleted ? (
        <CheckCircle className="h-5 w-5 text-[var(--quetzal-500)]" />
      ) : (
        <PlayCircle className="h-5 w-5" />
      )}
      <span>{label}</span>
    </button>
  );
};
