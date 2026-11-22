import { NavbarRoutes } from "@/components/navbar-routes";
import type { ChapterAccess } from "@/lib/chapter-access-rule";
import type { CourseNavTree } from "@/lib/course-nav-tree";
import { CourseMobileSidebar } from "./course-mobile-sidebar";

interface CourseNavbarProps {
  course: CourseNavTree;
  progressCount: number;
  chapterAccess: Record<string, ChapterAccess>;
}

export const CourseNavbar = ({ course, progressCount, chapterAccess }: CourseNavbarProps) => {
  return (
    <div className="flex h-full items-center border-b-2 border-foreground bg-background px-4">
      <CourseMobileSidebar course={course} progressCount={progressCount} chapterAccess={chapterAccess}/>
      <NavbarRoutes />
    </div>
  );
};
