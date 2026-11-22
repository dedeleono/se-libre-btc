"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const base = cn(
  "my-1 flex w-full items-center gap-x-3 rounded-[2px] px-3 py-4 text-left text-sm font-bold text-muted-foreground",
  "hover:bg-secondary hover:text-foreground",
  "transition-colors duration-200",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
);
const active =
  "border-2 border-foreground bg-foreground text-background hover:bg-foreground hover:text-background dark:bg-primary dark:text-primary-foreground";

export const CourseSidebarItem = ({
  id,
  label,
  isCompleted,
  courseId,
  isAccessible,
  customMessage,
}: CourseSidebarItemProps) => {
  const { t } = useLocale();
  const pathname = usePathname();
  const href = `/courses/${courseId}/chapters/${id}`;
  const isActive = pathname?.endsWith(`/chapters/${id}`) ?? false;

  if (!isAccessible) {
    return (
      <button
        type="button"
        aria-disabled="true"
        onClick={() => toast.error(customMessage || t.course.completePreviousToast)}
        className={cn(base, "cursor-not-allowed opacity-60")}
      >
        <Lock aria-hidden className="h-5 w-5 shrink-0" />
        <span>{label}</span>
        <span className="sr-only">{t.course.lockedLesson}</span>
      </button>
    );
  }

  return (
    <Link href={href} aria-current={isActive ? "page" : undefined} className={cn(base, isActive && active)}>
      {isCompleted ? (
        <CheckCircle aria-hidden className="h-5 w-5 shrink-0 text-[var(--quetzal-500)]" />
      ) : (
        <PlayCircle aria-hidden className="h-5 w-5 shrink-0" />
      )}
      <span>{label}</span>
    </Link>
  );
};
