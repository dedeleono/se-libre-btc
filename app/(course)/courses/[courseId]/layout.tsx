import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CourseSidebar } from "./_components/course-sidebar";
import { CourseNavbar } from "./_components/course-navbar";
import { hasCourseEnrollmentAccess } from "@/lib/chapter-access";
import { resolveChapterAccess, type ChapterAccess } from "@/lib/chapter-access-rule";
import { countCompletedChapters, findChapter } from "@/lib/course-nav-tree";
import { getCourseNavTree } from "@/lib/get-course-nav-tree";
import { headers } from "next/headers";
import { PreviewAccessCheck } from "./_components/preview-access-check";

const CourseLayout = async (props: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) => {
  const params = await props.params;

  const { children } = props;

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const role = session?.user?.role ?? null;
  const isAdmin = role === "ADMIN";

  // Check for chapter ID in the URL (x-pathname is set by middleware.ts).
  const pathParts = (await headers()).get("x-pathname")?.split("/") || [];
  const isChapterRoute = pathParts.includes("chapters");
  const chapterId = isChapterRoute
    ? pathParts[pathParts.indexOf("chapters") + 1]
    : null;

  const [tree, hasEnrollment] = await Promise.all([
    getCourseNavTree(params.courseId, userId, isAdmin),
    userId && !isAdmin
      ? hasCourseEnrollmentAccess(userId, params.courseId)
      : Promise.resolve(false),
  ]);

  if (!tree) {
    return redirect("/");
  }

  const chapterAccess: Record<string, ChapterAccess> = Object.fromEntries(
    tree.modules
      .flatMap((module) => module.chapters)
      .map((chapter) => [
        chapter.id,
        resolveChapterAccess({
          isAuthenticated: !!userId,
          role,
          isIntro: chapter.isIntro,
          hasEnrollment,
        }),
      ]),
  );
  const progressCount = userId ? countCompletedChapters(tree) : 0;

  // Signed-out visitors on a chapter route: the chapter page handles preview access.
  const previewChapter =
    !session?.user && chapterId ? findChapter(tree, chapterId) : null;

  return (
    <div className="dl-app h-full w-full max-w-full overflow-x-hidden">
      {previewChapter && (
        <PreviewAccessCheck
          chapterId={previewChapter.id}
          isIntro={previewChapter.isIntro}
        />
      )}
      <div className="fixed inset-x-0 top-0 z-50 h-16 w-full md:pl-80">
        <CourseNavbar
          course={tree}
          progressCount={progressCount}
          chapterAccess={chapterAccess}
        />
      </div>
      <div className="fixed inset-y-0 left-0 z-50 hidden h-full w-80 flex-col md:flex">
        <CourseSidebar
          course={tree}
          isAuthenticated={!!session?.user}
          currentUserRole={role}
          chapterAccess={chapterAccess}
          progressCount={progressCount}
        />
      </div>
      <main className="dl-stamped h-full w-full max-w-full pt-16 md:pl-80">
        {children}
      </main>
    </div>
  );
};

export default CourseLayout;
