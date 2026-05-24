import { NavbarRoutes } from "@/components/navbar-routes";
import { Chapter, Course, CourseModule, ChapterProgress } from "@prisma/client";
import { CourseMobileSidebar } from "./course-mobile-sidebar";

interface CourseNavbarProps {
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

export const CourseNavbar = ({ course, progressCount, chaptersAccessibility }: CourseNavbarProps) => {
  return (
    <div className="p-4 border-b h-full flex items-center bg-background shadow-sm 
      dark:bg-black/40 dark:border-white/[0.05] dark:backdrop-blur-xl 
      dark:shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
      <CourseMobileSidebar course={course} progressCount={progressCount} chaptersAccessibility={chaptersAccessibility}/>
      <NavbarRoutes />
    </div>
  );
};
