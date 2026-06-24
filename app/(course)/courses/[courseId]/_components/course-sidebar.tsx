"use client";

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
  customLockMessages?: Record<string, string>;
}

export const CourseSidebar = ({
  course,
  currentUserRole,
  userSession,
  chaptersAccessibility,
  customLockMessages = {}
}: CourseSidebarProps) => {
  const isAuthenticated = !!userSession?.user;

  return (
    <div
      className="flex h-full flex-col overflow-y-auto border-r-2 border-foreground bg-background"
    >
      <div className="flex flex-col border-b-2 border-foreground p-6">
        <GuateLibreLogo width={150} priority className="mb-4" />
        <div className="page-eyebrow">Lección</div>
        <h1 className="mt-3 text-3xl">
          {course.title}
        </h1>
      </div>
      <div className="flex flex-col w-full">
        <Accordion type="single" collapsible className="w-full">
          {course.modules.map((module) => (
            <AccordionItem value={module.id} key={module.id}>
              <AccordionTrigger
                className={cn(
                  "px-6 text-sm font-bold uppercase tracking-[0.08em] transition-all",
                  "data-[state=open]:bg-secondary data-[state=open]:text-foreground"
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
