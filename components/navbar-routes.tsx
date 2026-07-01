"use client";

import { usePathname, useRouter } from "next/navigation";
import { FileText, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { SearchInput } from "./search-input";
import ThemeToggle from "./layout/ThemeToggle/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocale } from "@/lib/i18n";

export const NavbarRoutes = () => {
  const pathName = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLocale();

  const isCoursePage = pathName?.includes("/courses");
  const isStudentBrowsePage = pathName?.includes("/student/browse");
  const courseId = pathName?.match(/\/courses\/([^\/]+)/)?.[1] ?? null;
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const canManageCourses = userRole === "ADMIN";
  const canReturnToStudentDashboard = userRole === "STUDENT" && isCoursePage;

  return (
    <div className="ml-auto flex items-center gap-x-2">
      {isStudentBrowsePage && (
        <div className="hidden md:block">
          <SearchInput />
        </div>
      )}

      {canManageCourses && isCoursePage && courseId && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push(`/admin/courses/${courseId}`)}
          className="dark:text-white/70 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          {t.nav.manageCourse}
        </Button>
      )}

      {canReturnToStudentDashboard && (
        <Button
          asChild
          size="sm"
          variant="outline"
          className="hidden sm:inline-flex"
        >
          <Link href="/student">
            <LayoutDashboard data-icon="inline-start" />
            {t.nav.dashboard}
          </Link>
        </Button>
      )}

      {canReturnToStudentDashboard && (
        <Button asChild size="icon" variant="outline" className="sm:hidden">
          <Link href="/student" aria-label={t.nav.dashboard}>
            <LayoutDashboard data-icon="icon" />
          </Link>
        </Button>
      )}

      {isCoursePage && courseId && (
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="gap-2 rounded-sm dark:text-white/70 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          <Link href={`/courses/${courseId}/student-resources`}>
            <FileText data-icon="inline-start" />
            {t.nav.resources}
          </Link>
        </Button>
      )}
      <LanguageToggle />
      <ThemeToggle />
    </div>
  );
};
