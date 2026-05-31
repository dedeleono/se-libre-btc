"use client";

import { usePathname, useRouter } from "next/navigation";
import { FileText } from "lucide-react";
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
  const canManageCourses = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

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

      {isCoursePage && courseId && (
        <Link href={`/courses/${courseId}/student-resources`} className="w-full">
          <Button size="sm" variant="ghost" className="w-full gap-2 rounded-sm hover:bg-transparent dark:text-white/70 dark:hover:bg-white/[0.06] dark:hover:text-white">
            <FileText className="h-4 w-4" />
            {t.nav.resources}
          </Button>
        </Link>
      )}
      <LanguageToggle />
      <ThemeToggle />
    </div>
  );
};
