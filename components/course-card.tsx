"use client";

import Image from "next/image";
import Link from "next/link";
import { IconBadge } from "@/components/icon-badge";
import { BookOpen, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrollmentButton } from "@/components/enrollment-button";
import { useLocale } from "@/lib/i18n";
import { getCourseLearningHref } from "@/lib/course-navigation";

interface CourseCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  chaptersLength: number;
  isEnrolled: boolean;
  progress: number | null;
  category: string | null;
  firstChapterId?: string | null;
}

export const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  isEnrolled,
  progress,
  category,
  firstChapterId,
}: CourseCardProps) => {
  const { t } = useLocale();

  // Enrolled users link straight to the first chapter, skipping the
  // /courses/[id] redirect hop (an extra server round-trip). Fall back to the
  // redirect route if we don't have a chapter id.
  const enrolledHref = getCourseLearningHref(id, [
    { chapters: firstChapterId ? [{ id: firstChapterId }] : [] },
  ]);
  const cardHref = isEnrolled ? enrolledHref : `/courses/preview/${id}`;

  return (
    <div className="stamp-card group flex h-full w-full flex-col overflow-hidden p-3 transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_hsl(var(--foreground))] dark:hover:shadow-[6px_6px_0_var(--naranja-500)]">
      <Link href={cardHref}>
        <div className="relative w-full aspect-video overflow-hidden border-2 border-foreground">
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary dl-stamped">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {t.course.noImage}
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-col pt-2">
        <Link href={cardHref}>
          <div className="line-clamp-2 text-balance font-[var(--font-display)] text-2xl uppercase leading-none transition-colors group-hover:text-[var(--terracota-500)]">
            {title}
          </div>
        </Link>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {category}
        </p>
        <div className="flex items-center my-3 text-sm md:text-xs">
          <div className="flex items-center gap-x-2 text-muted-foreground">
            <IconBadge size="sm" icon={BookOpen} />
            <span>{t.course.chaptersCount(chaptersLength)}</span>
          </div>
        </div>
        {isEnrolled && progress !== null && (
          <div className="flex items-center gap-x-2 text-sm md:text-xs">
            <IconBadge size="sm" icon={CheckCircle} />
            <p className="tabular-nums">{progress}%</p>
          </div>
        )}
        <div className="mt-auto pt-3">
          {isEnrolled ? (
            <Button asChild className="w-full" size="sm">
              <Link href={enrolledHref}>{t.common.continue}</Link>
            </Button>
          ) : (
            <EnrollmentButton
              productId={id}
              productType="course"
              redirectTo={`/courses/${id}`}
              className="w-full"
              size="sm"
            >
              {t.course.enrollForFree}
            </EnrollmentButton>
          )}
        </div>
      </div>
    </div>
  );
};
