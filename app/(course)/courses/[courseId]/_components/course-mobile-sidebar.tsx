"use client";

import { useSession } from "@/lib/auth-client";
import type { ChapterAccess } from "@/lib/chapter-access-rule";
import type { CourseNavTree } from "@/lib/course-nav-tree";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CourseSidebar } from "./course-sidebar";
import { useLocale } from "@/lib/i18n";

interface CourseMobileSidebarProps {
  course: CourseNavTree;
  progressCount: number;
  chapterAccess: Record<string, ChapterAccess>;
}

export const CourseMobileSidebar = ({
  course,
  progressCount,
  chapterAccess,
}: CourseMobileSidebarProps) => {
  const { data: session } = useSession();
  const currentUserRole = (session?.user as { role?: string } | undefined)
    ?.role;
  const { t } = useLocale();

  return (
    <Sheet>
      <SheetTrigger
        aria-label={t.nav.menu}
        className="md:hidden inline-flex items-center justify-center -m-[11px] p-[11px] hover:opacity-75 transition-opacity"
      >
        <Menu className="dark:text-white/90 text-primary" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 bg-background w-72 dark:bg-gradient-to-b dark:from-card/50 dark:to-background/30 
          dark:border-white/[0.05] dark:backdrop-blur-xl"
      >
        <SheetTitle className="sr-only">{t.nav.myLearning}</SheetTitle>
        <CourseSidebar
          course={course}
          isAuthenticated={!!session?.user}
          chapterAccess={chapterAccess}
          currentUserRole={currentUserRole}
          progressCount={progressCount}
        />
      </SheetContent>
    </Sheet>
  );
};
