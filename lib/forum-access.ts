export type ForumPostScope = {
  courseId: string | null;
  learningPathId: string | null;
  cohortId: string | null;
};

export type ForumMemberships = {
  courseIds: readonly string[];
  learningPathIds: readonly string[];
  cohortIds: readonly string[];
};

export function canReadForumPost(role: "ADMIN" | "STUDENT", post: ForumPostScope, memberships: ForumMemberships): boolean {
  if (role === "ADMIN") return true;
  return (
    (post.courseId !== null && memberships.courseIds.includes(post.courseId)) ||
    (post.learningPathId !== null && memberships.learningPathIds.includes(post.learningPathId)) ||
    (post.cohortId !== null && memberships.cohortIds.includes(post.cohortId))
  );
}
