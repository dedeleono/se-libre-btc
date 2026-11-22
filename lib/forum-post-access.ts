import "server-only";

import { prisma } from "@/lib/db";
import { canReadForumPost, type ForumPostScope } from "@/lib/forum-access";

export async function userCanReadForumPost(
  user: { id: string; role: "ADMIN" | "STUDENT" },
  post: ForumPostScope
): Promise<boolean> {
  if (user.role === "ADMIN") return true;

  const [course, learningPath, cohort] = await Promise.all([
    post.courseId
      ? prisma.courseEnrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: post.courseId } },
          select: { courseId: true },
        })
      : null,
    post.learningPathId
      ? prisma.learningPathEnrollment.findUnique({
          where: { userId_learningPathId: { userId: user.id, learningPathId: post.learningPathId } },
          select: { learningPathId: true },
        })
      : null,
    post.cohortId
      ? prisma.cohortEnrollment.findUnique({
          where: { userId_cohortId: { userId: user.id, cohortId: post.cohortId } },
          select: { cohortId: true },
        })
      : null,
  ]);

  return canReadForumPost(user.role, post, {
    courseIds: course ? [course.courseId] : [],
    learningPathIds: learningPath ? [learningPath.learningPathId] : [],
    cohortIds: cohort ? [cohort.cohortId] : [],
  });
}
