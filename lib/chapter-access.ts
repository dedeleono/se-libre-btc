import { prisma } from "@/lib/db";
import { ChapterWithProgress } from "@/types/chapter";

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

  return true;
};
