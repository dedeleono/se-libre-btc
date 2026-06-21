import { cache } from "react";

import { prisma } from "@/lib/db";
import { ChapterWithProgress } from "@/types/chapter";

// Wrapped in React cache() so the layout and the chapter page (and the
// per-chapter checks) share a single result per (userId, courseId) within one
// request instead of re-querying. The three enrollment lookups are independent,
// so we run them concurrently rather than as a serial waterfall of early
// returns — worst case (cohort-only enrollment) drops from 3 round-trips to 1.
export const hasCourseEnrollmentAccess = cache(
  async (userId: string, courseId: string) => {
    const [directEnrollment, pathEnrollment, cohortEnrollment] =
      await Promise.all([
        prisma.courseEnrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId,
            },
          },
          select: { status: true },
        }),
        prisma.learningPathEnrollment.findFirst({
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
        }),
        prisma.cohortEnrollment.findFirst({
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
        }),
      ]);

    const hasDirectAccess =
      directEnrollment?.status === "ACTIVE" ||
      directEnrollment?.status === "COMPLETED";

    return hasDirectAccess || Boolean(pathEnrollment) || Boolean(cohortEnrollment);
  }
);

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
