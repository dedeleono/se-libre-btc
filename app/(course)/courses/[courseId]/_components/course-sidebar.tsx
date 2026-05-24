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
      className="h-full border-r flex flex-col overflow-y-auto shadow-sm bg-background 
      dark:bg-gradient-to-b dark:from-card/50 dark:to-background/30 
      dark:border-white/[0.05] dark:backdrop-blur-xl"
    >
      <div className="p-6 flex flex-col border-b dark:border-white/[0.05] dark:bg-card/30">
        <h1 className="font-black sm:text-xl text-lg text-primary font-['Open_Sans'] p-1 sm:p-0">
          {course.title}
        </h1>
      </div>
      <div className="flex flex-col w-full">
        <Accordion type="single" collapsible className="w-full">
          {course.modules.map((module) => (
            <AccordionItem value={module.id} key={module.id}>
              <AccordionTrigger
                className={cn(
                  "text-base font-medium px-6 transition-all",
                  "data-[state=open]:text-success data-[state=open]:font-black data-[state=open]:bg-success/10 data-[state=open]:hover:bg-success/20 data-[state=open]:hover:text-success data-[state=open]:border-r-2 data-[state=open]:border-success/80 data-[state=open]:scale-105",
                  "data-[state=open]:dark:bg-white/[0.08] data-[state=open]:dark:text-success data-[state=open]:dark:hover:bg-white/[0.12] data-[state=open]:dark:hover:text-success"
                )}
              >
                {module.title}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col">
                {module.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="relative pl-1 border-l-2 border-slate-200 dark:border-white/[0.08] ml-6"
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
