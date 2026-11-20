import { cache } from "react";

import { prisma } from "@/lib/db";

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
