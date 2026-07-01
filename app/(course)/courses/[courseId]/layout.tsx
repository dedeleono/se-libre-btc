import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CourseSidebar } from "./_components/course-sidebar";
import { CourseNavbar } from "./_components/course-navbar";
import { ChapterWithProgress } from "@/types/chapter";
import { hasCourseEnrollmentAccess } from "@/lib/chapter-access";
import { headers } from "next/headers";
import { PreviewAccessCheck } from "./_components/preview-access-check";

const CourseLayout = async (props: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) => {
  const params = await props.params;

  const { children } = props;

  const session = await auth();
  const userId = session?.user?.id || null;
  const userRole = session?.user?.role || null;

  // Check for chapter ID in the URL (x-pathname is set by middleware.ts).
  const pathParts = (await headers()).get("x-pathname")?.split("/") || [];
  const isChapterRoute = pathParts.includes("chapters");
  const chapterId = isChapterRoute
    ? pathParts[pathParts.indexOf("chapters") + 1]
    : null;

  // For chapter routes, let the chapter page handle preview access
  if (!session?.user && isChapterRoute) {
    const course = await prisma.course.findUnique({
      where: {
        id: params.courseId,
      },
      include: {
        modules: {
          include: {
            chapters: {
              where: {
                isPublished: true,
              },
              include: {
                studentProgress: {
                  where: {
                    userId: "none",
                  },
                },
              },
              orderBy: {
                position: "asc",
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
        attachments: true,
      },
    });

    if (!course) {
      return redirect("/");
    }

    // Get all chapters in a flat array for easier access
    const allChapters = course.modules.flatMap((module) => module.chapters);

    // Get the current chapter to check if it's an intro
    const currentChapter = allChapters.find(
      (chapter) => chapter.id === chapterId,
    );

    // Pre-calculate chapter accessibility and custom messages in a single loop
    const chaptersAccessibility: Record<string, boolean> = {};
    const customLockMessages: Record<string, string> = {};

    for (const courseModule of course.modules) {
      for (const chapter of courseModule.chapters) {
        // For non-authenticated users, only intro chapters are accessible
        chaptersAccessibility[chapter.id] = chapter.isIntro;

        // Add custom message for locked chapters
        if (!chapter.isIntro) {
          customLockMessages[chapter.id] = "Sign in to access this content";
        }
      }
    }

    return (
      <div className="dl-app h-full w-full max-w-full overflow-x-hidden">
        {currentChapter && (
          <PreviewAccessCheck
            chapterId={currentChapter.id}
            isIntro={currentChapter.isIntro}
          />
        )}
        <div className="fixed inset-x-0 top-0 z-50 h-16 w-full md:pl-80">
          <CourseNavbar
            course={course}
            progressCount={0}
            chaptersAccessibility={chaptersAccessibility}
          />
        </div>
        <div className="fixed inset-y-0 left-0 z-50 hidden h-full w-80 flex-col md:flex">
          <CourseSidebar
            course={course}
            userSession={null}
            chaptersAccessibility={chaptersAccessibility}
            currentUserRole={null}
            progressCount={0}
            customLockMessages={customLockMessages}
          />
        </div>
        <main className="dl-stamped h-full w-full max-w-full pt-16 md:pl-80">
          {children}
        </main>
      </div>
    );
  }

  const course = await prisma.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      modules: {
        include: {
          chapters: {
            where: {
              ...(!session || userRole === "STUDENT"
                ? {
                    OR: [{ isPublished: true }, { isIntro: true }],
                  }
                : {}),
            },
            include: {
              studentProgress: userId
                ? {
                    where: { userId },
                  }
                : false,
            },
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
      attachments: session ? true : false,
    },
  });

  if (!course) {
    return redirect("/");
  }

  // Only calculate completedChapters and percentage if there's a user session
  const completedChapters = session?.user
    ? course.modules.reduce((acc, module) => {
        return (
          acc +
          module.chapters.filter(
            (chapter) =>
              chapter.studentProgress &&
              chapter.studentProgress[0]?.isCompleted,
          ).length
        );
      }, 0)
    : 0;

  // Collect all chapters that need accessibility checks
  const chaptersToCheck = course.modules.flatMap((module) =>
    module.chapters.map((chapter) => ({
      chapter: {
        ...chapter,
        module: {
          courseId: course.id,
          position: module.position,
          id: module.id,
        },
        moduleId: module.id,
        studentProgress: chapter.studentProgress || [],
      } as ChapterWithProgress,
      chapterId: chapter.id,
    })),
  );

  // Optimization: resolve accessibility without per-chapter DB queries.
  const chaptersAccessibility: Record<string, boolean> = {};

  // Enrollment is per-course, not per-chapter — resolve it ONCE instead of
  // calling isChapterAccessible() (a DB round-trip) inside the loop for every
  // locked chapter. Only authenticated non-admin users reach this check.
  const hasEnrollmentAccess =
    userId && userRole && userRole !== "ADMIN"
      ? await hasCourseEnrollmentAccess(userId, course.id)
      : false;

  for (const { chapter, chapterId } of chaptersToCheck) {
    // Intro chapters are always accessible
    if (chapter.isIntro) {
      chaptersAccessibility[chapterId] = true;
      continue;
    }

    // Admins always have access
    if (userRole === "ADMIN") {
      chaptersAccessibility[chapterId] = true;
      continue;
    }

    // Non-authenticated users can't access non-intro chapters
    if (!userId || !userRole) {
      chaptersAccessibility[chapterId] = false;
      continue;
    }

    // For completed chapters, check if they're in the student progress
    if (chapter.studentProgress && chapter.studentProgress[0]?.isCompleted) {
      chaptersAccessibility[chapterId] = true;
      continue;
    }

    // Everything else depends solely on course enrollment (resolved once above)
    chaptersAccessibility[chapterId] = hasEnrollmentAccess;
  }

  return (
    <div className="dl-app h-full w-full max-w-full overflow-x-hidden">
      <div className="fixed inset-x-0 top-0 z-50 h-16 w-full md:pl-80">
        <CourseNavbar
          course={course}
          progressCount={completedChapters}
          chaptersAccessibility={chaptersAccessibility}
        />
      </div>
      <div className="fixed inset-y-0 left-0 z-50 hidden h-full w-80 flex-col md:flex">
        <CourseSidebar
          course={course}
          currentUserRole={userRole}
          userSession={session}
          chaptersAccessibility={chaptersAccessibility}
          progressCount={completedChapters}
        />
      </div>
      <main className="dl-stamped h-full w-full max-w-full pt-16 md:pl-80">
        {children}
      </main>
    </div>
  );
};

export default CourseLayout;
