"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
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
  isCourseFree: boolean;
  isLocked: boolean;
  type: string;
  startTime?: Date | null;
  endTime?: Date | null;
  isAccessible?: boolean;
  lockReason?: ChapterLockReason;
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
  isCourseFree,
  isAccessible,
  lockReason,
}: CourseSidebarItemProps) => {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const chapterHref = `/courses/${courseId}/chapters/${id}`;
  const isActive = pathname?.endsWith(`/chapters/${id}`) ?? false;
  const [isLockHelpOpen, setIsLockHelpOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const actionRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const panelId = useId();
  const messageId = useId();

  const needsSignIn = lockReason === "SIGN_IN_REQUIRED";

  // The panel's action follows the row in the DOM, so focus moves there in
  // place: no toast outside the mobile sheet's focus trap.
  useEffect(() => {
    if (isLockHelpOpen) actionRef.current?.focus();
  }, [isLockHelpOpen]);

  const enroll = async () => {
    setIsEnrolling(true);
    try {
      await axios.post(`/api/courses/${courseId}/enroll`);
      toast.success(t.toasts.enrollmentComplete);
      router.push(chapterHref);
      router.refresh();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error) && error.response?.status === 402
          ? t.toasts.enrollmentUnavailable
          : t.toasts.enrollmentError,
      );
      setIsEnrolling(false);
    }
  };

  if (isAccessible) {
    return (
      <Link href={chapterHref} aria-current={isActive ? "page" : undefined} className={cn(base, isActive && active)}>
        {isCompleted ? (
          <CheckCircle aria-hidden className="h-5 w-5 shrink-0 text-[var(--quetzal-500)]" />
        ) : (
          <PlayCircle aria-hidden className="h-5 w-5 shrink-0" />
        )}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsLockHelpOpen((open) => !open)}
        type="button"
        aria-expanded={isLockHelpOpen}
        aria-controls={panelId}
        className={cn(base, isActive && active, "opacity-60")}
      >
        <Lock aria-hidden className="h-5 w-5 shrink-0" />
        <span>{label}</span>
        <span className="sr-only">{t.course.lockedLesson}</span>
      </button>
      {isLockHelpOpen && (
        <div
          id={panelId}
          className="mb-2 mr-3 flex flex-col items-start gap-3 rounded-[2px] border-2 border-[var(--maiz-500)] bg-[var(--maiz-100)] p-3 text-sm text-[var(--volcan-900)]"
        >
          <p id={messageId} className="text-pretty">
            {needsSignIn
              ? t.course.signInToAccess
              : isCourseFree
                ? t.course.enrollToAccess
                : t.course.enrollInCourseToAccess}
          </p>
          {needsSignIn ? (
            <Button asChild size="sm">
              <Link
                ref={actionRef}
                href={`/sign-in?callbackUrl=${encodeURIComponent(chapterHref)}`}
                aria-describedby={messageId}
              >
                {t.nav.signIn}
              </Link>
            </Button>
          ) : !isCourseFree ? (
            <Button asChild size="sm">
              <Link ref={actionRef} href={`/courses/preview/${courseId}`} aria-describedby={messageId}>
                {t.public.viewCourse}
              </Link>
            </Button>
          ) : (
            <Button
              ref={actionRef}
              type="button"
              size="sm"
              onClick={enroll}
              disabled={isEnrolling}
              aria-describedby={messageId}
            >
              {isEnrolling ? t.course.enrolling : t.course.enrollForFree}
            </Button>
          )}
        </div>
      )}
    </>
  );
};
