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
        "flex items-center gap-x-3 my-1 text-slate-500 text-sm font-normal py-4 px-3 w-full",
        "hover:text-slate-600 hover:bg-slate-300/20",
        "dark:text-white/70 dark:hover:text-white dark:hover:bg-white/[0.06]",
        "transition-all duration-200",
        isActive && 
          "text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary border-r-2 border-primary/80" +
          " dark:bg-white/[0.08] dark:text-secondary dark:hover:bg-white/[0.12] dark:hover:text-secondary" +
          " dark:border-none",
        !isAccessible && "opacity-60"
      )}
    >
      {!isAccessible && currentUserRole === "STUDENT" ? (
        <Lock className="h-5 w-5 dark:text-white/70" />
      ) : isCompleted ? (
        <CheckCircle className="h-5 w-5 text-success dark:text-success/90" />
      ) : (
        <PlayCircle className="h-5 w-5 dark:text-white/70" />
      )}
      <span>{label}</span>
    </button>
  );
};
