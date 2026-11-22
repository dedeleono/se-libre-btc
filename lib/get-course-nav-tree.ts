import { cache } from "react";

import { prisma } from "@/lib/db";
import { toCourseNavTree, type CourseNavTree } from "@/lib/course-nav-tree";

// Shared per request by the course layout and the chapter page (React cache()).
// Arguments must be primitives so cache() can match them.
export const getCourseNavTree = cache(
  async (courseId: string, userId: string | null, isAdmin: boolean): Promise<CourseNavTree | null> => {
    const row = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        isFree: true,
        modules: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            chapters: {
              where: isAdmin ? {} : { isPublished: true },
              orderBy: { position: "asc" },
              select: {
                id: true,
                title: true,
                type: true,
                isIntro: true,
                isPublished: true,
                studentProgress: userId
                  ? { where: { userId }, select: { isCompleted: true } }
                  : false,
              },
            },
          },
        },
      },
    });
    return row ? toCourseNavTree(row) : null;
  },
);
