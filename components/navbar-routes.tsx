"use client";

import { redirect, usePathname, useRouter } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { FileText, LogOut } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SearchInput } from "./search-input";
import ThemeToggle from "./layout/ThemeToggle/theme-toggle";

export const NavbarRoutes = () => {
  const pathName = usePathname();
  const { data: session } = useSession();
  
  const isTeacherPage = pathName?.startsWith("/teacher");
  const isCoursePage = pathName?.includes("/courses");
  const isStudentBrowsePage = pathName?.includes("/student/browse");
  const isStudentResourcesPage = pathName?.startsWith("/courses");

  const router = useRouter();

  const getCourseId = () => {
    const matches = pathName?.match(/\/courses\/([^\/]+)/);
    return matches ? matches[1] : null;
  };

  const courseId = getCourseId(); 
  const isTeacherOrAdmin = session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN";

  return (
    <div className="flex gap-x-2 ml-auto items-center">
      {isStudentBrowsePage && (
        <div className="hidden md:block">
          <SearchInput />
        </div>
      )}

      <div className="flex gap-x-2 ml-auto">
        {isTeacherOrAdmin && courseId && (
          <>
            {isTeacherPage ? (
              <div onClick={() => router.push(`/courses/${courseId}`)}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="dark:text-white/70 dark:hover:text-white 
                    dark:hover:bg-white/[0.06] transition-colors"
                >
                  Modo Estudiante
                </Button>
              </div>
            ) : (
              isCoursePage && (
                <div
                  onClick={() => router.push(`/teacher/courses/${courseId}`)}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="dark:text-white/70 dark:hover:text-white 
                      dark:hover:bg-white/[0.06] transition-colors"
                  >
                    Modo Profesor
                  </Button>
                </div>
              )
            )}
          </>
        )}

        {isStudentResourcesPage && (
          <Link
            href={`/courses/${courseId}/student-resources`}
            className="w-full"
          >
            <Button
              size="sm"
              variant="ghost"
              className="w-full gap-2 rounded-sm dark:text-white/70 
                dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors hover:bg-transparent"
            >
              <FileText className="h-4 w-4" />
              Recursos del Curso
            </Button>
          </Link>
        )}
      </div>
      <ThemeToggle />
    </div>
  );
};
