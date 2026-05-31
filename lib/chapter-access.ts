import { prisma } from "@/lib/db";
import { ChapterWithProgress } from "@/types/chapter";

const getPublishedChapterSequence = async (courseId: string): Promise<string[]> => {
  const modules = await prisma.courseModule.findMany({
    where: {
      courseId,
    },
    orderBy: {
      position: "asc",
    },
    select: {
      chapters: {
        where: {
          isPublished: true,
        },
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
        },
      },
    },
  });

  return modules.flatMap((module) => module.chapters.map((chapter) => chapter.id));
};

async function hasCourseEnrollmentAccess(userId: string, courseId: string) {
  const directEnrollment = await prisma.courseEnrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    select: { status: true },
  });

  if (directEnrollment?.status === "ACTIVE" || directEnrollment?.status === "COMPLETED") {
    return true;
  }

  const pathEnrollment = await prisma.learningPathEnrollment.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "COMPLETED"] },
      learningPath: {
        courses: {
          some: { courseId },
        },
      },
    },
    select: { id: true },
  });

  if (pathEnrollment) {
    return true;
  }

  const cohortEnrollment = await prisma.cohortEnrollment.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "COMPLETED"] },
      cohort: {
        OR: [
          { courseId },
          {
            learningPath: {
              courses: {
                some: { courseId },
              },
            },
          },
        ],
      },
    },
    select: { id: true },
  });

  return Boolean(cohortEnrollment);
}

export const isChapterAccessible = async (
  chapter: ChapterWithProgress,
  userId: string | null,
  userRole: string | null
): Promise<boolean> => {
  if (!userId || !userRole) {
    return false;
  }

  if (chapter.isIntro) {
    return true;
  }

  if (userRole === "ADMIN") {
    return true;
  }

  const courseId = chapter.module?.courseId;
  if (!courseId) {
    return false;
  }

  const hasEnrollmentAccess = await hasCourseEnrollmentAccess(userId, courseId);
  if (!hasEnrollmentAccess) {
    return false;
  }

  const publishedChapterIds = await getPublishedChapterSequence(courseId);
  const currentChapterIndex = publishedChapterIds.indexOf(chapter.id);

  if (currentChapterIndex === 0) {
    return true;
  }

  const previousChapterId = currentChapterIndex > 0
    ? publishedChapterIds[currentChapterIndex - 1]
    : null;

  if (previousChapterId) {
    const previousProgress = await prisma.chapterProgress.findUnique({
      where: {
        userId_chapterId: {
          userId,
          chapterId: previousChapterId,
        },
      },
      select: {
        isCompleted: true,
      },
    });

    if (previousProgress?.isCompleted) {
      return true;
    }
  }

  return true;
};
