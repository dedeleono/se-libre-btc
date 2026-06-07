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
    <div className="flex h-full items-center border-b-2 border-foreground bg-background px-4">
      <CourseMobileSidebar course={course} progressCount={progressCount} chaptersAccessibility={chaptersAccessibility}/>
      <NavbarRoutes />
    </div>
  );
};
