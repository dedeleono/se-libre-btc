"use client";

import { useSession } from "@/lib/auth-client";
import { Chapter, Course, CourseModule, ChapterProgress } from "@prisma/client";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CourseSidebar } from "./course-sidebar";

interface CourseMobileSidebarProps {
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
  progressCount: number;
  chaptersAccessibility: Record<string, boolean>;
}

export const CourseMobileSidebar = ({ 
  course, 
  progressCount,
  chaptersAccessibility 
}: CourseMobileSidebarProps) => {
  const { data: session } = useSession();
  const currentUserRole = (session?.user as { role?: string } | undefined)?.role;

  return (
    <Sheet>
      <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
        <Menu className="dark:text-white/90 text-primary" />
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="p-0 bg-background w-72 dark:bg-gradient-to-b dark:from-card/50 dark:to-background/30 
          dark:border-white/[0.05] dark:backdrop-blur-xl"
      >
        <CourseSidebar 
          course={course} 
          userSession={session}
          chaptersAccessibility={chaptersAccessibility}
          currentUserRole={currentUserRole}
        />
      </SheetContent>
    </Sheet>
  );
};
