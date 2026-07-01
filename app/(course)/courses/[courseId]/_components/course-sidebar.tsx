"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CourseSidebarItem } from "./course-sidebar-item";
import { Course, CourseModule, Chapter, ChapterProgress } from "@prisma/client";
import { cn } from "@/lib/utils";
import GuateLibreLogo from "@/components/guate-libre-logo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n";

interface CourseSidebarProps {
  course: Course & {
    modules: (CourseModule & {
      chapters: (Chapter & {
        studentProgress: ChapterProgress[] | null;
      })[];
    })[];
    attachments: {
      id: string;
      name: string;
      url: string;
    }[];
  };
  currentUserRole?: string | null;
  userSession: any;
  chaptersAccessibility: Record<string, boolean>;
  progressCount: number;
  customLockMessages?: Record<string, string>;
}

export const CourseSidebar = ({
  course,
  currentUserRole,
  userSession,
  chaptersAccessibility,
  progressCount,
  customLockMessages = {},
}: CourseSidebarProps) => {
  const { t } = useLocale();
  const isAuthenticated = !!userSession?.user;
  const totalChapters = course.modules.reduce(
    (total, module) => total + module.chapters.length,
    0,
  );
  const progressValue =
    totalChapters > 0 ? Math.round((progressCount / totalChapters) * 100) : 0;
  const canReturnToDashboard = isAuthenticated && currentUserRole === "STUDENT";

  return (
    <div className="flex h-full flex-col overflow-y-auto border-r-2 border-foreground bg-background">
      <div className="flex flex-col border-b-2 border-foreground p-6">
        <GuateLibreLogo width={150} priority className="mb-4" />
        {canReturnToDashboard && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mb-5 w-full justify-start"
          >
            <Link href="/student">
              <LayoutDashboard data-icon="inline-start" />
              {t.nav.dashboard}
            </Link>
          </Button>
        )}
        <div className="page-eyebrow">{t.admin.lesson}</div>
        <h1 className="mt-3 text-3xl text-balance">{course.title}</h1>
        {isAuthenticated && totalChapters > 0 && (
          <div className="mt-5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              <span>{t.course.courseProgress}</span>
              <span className="tabular-nums">
                {progressCount}/{totalChapters}
              </span>
            </div>
            <Progress
              value={progressValue}
              className="h-2 rounded-[2px] border border-foreground bg-secondary"
            />
          </div>
        )}
      </div>
      <div className="flex flex-col w-full">
        <Accordion type="single" collapsible className="w-full">
          {course.modules.map((module) => (
            <AccordionItem value={module.id} key={module.id}>
              <AccordionTrigger
                className={cn(
                  "px-6 text-sm font-bold uppercase tracking-[0.08em] transition-colors",
                  "data-[state=open]:bg-secondary data-[state=open]:text-foreground",
                )}
              >
                {module.title}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col">
                {module.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="relative ml-6 border-l-2 border-foreground/20 pl-1"
                  >
                    <CourseSidebarItem
                      id={chapter.id}
                      label={chapter.title}
                      isCompleted={!!chapter.studentProgress?.[0]?.isCompleted}
                      courseId={course.id}
                      isLocked={!chaptersAccessibility[chapter.id]}
                      type={chapter.type}
                      currentUserRole={currentUserRole}
                      isAccessible={chaptersAccessibility[chapter.id]}
                      customMessage={customLockMessages[chapter.id]}
                    />
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {/* {isAuthenticated && course.attachments.length > 0 && (
          <div className="mt-auto p-6">
            <div className="flex items-center gap-x-2 font-semibold">
              <File className="h-5 w-5 text-primary dark:text-white/80" />
              <span>Course attachments</span>
            </div>
            <div className="mt-2 space-y-2">
              {course.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  className="flex items-center p-3 w-full bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20 rounded-md text-sm font-medium transition"
                >
                  <FileText className="h-4 w-4 mr-2 text-primary dark:text-white/80" />
                  <p className="line-clamp-1">{attachment.name}</p>
                </a>
              ))}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};
