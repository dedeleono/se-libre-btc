"use client";

import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { Lock, CheckCircle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { ChapterLockReason } from "@/lib/chapter-access-rule";

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
  lockReason?: ChapterLockReason;
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
  lockReason
}: CourseSidebarItemProps) => {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname?.includes(id);

  const chapterHref = `/courses/${courseId}/chapters/${id}`;

  const enroll = () => {
    toast.dismiss("chapter-locked");
    toast.promise(axios.post(`/api/courses/${courseId}/enroll`), {
      loading: t.course.enrolling,
      success: () => {
        router.push(chapterHref);
        router.refresh();
        return t.toasts.enrollmentComplete;
      },
      error: (error) =>
        axios.isAxiosError(error) && error.response?.status === 402
          ? t.toasts.enrollmentUnavailable
          : t.toasts.enrollmentError,
    });
  };

  const onClick = () => {
    if (!isAccessible) {
      if (lockReason === "SIGN_IN_REQUIRED") {
        toast(t.course.signInToAccess, { id: "chapter-locked" });
        return;
      }
      toast(t.course.enrollToAccess, {
        id: "chapter-locked",
        duration: Infinity,
        closeButton: true,
        action: (
          <Button type="button" size="sm" className="ml-auto shrink-0" onClick={enroll}>
            {t.course.enrollForFree}
          </Button>
        ),
      });
      return;
    }
    router.push(chapterHref);
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
