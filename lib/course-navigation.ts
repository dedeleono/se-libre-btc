type CourseNavigationChapter = {
  id: string;
};

type CourseNavigationModule = {
  chapters: CourseNavigationChapter[];
};

export function getFirstPublishedChapterId(modules: CourseNavigationModule[]) {
  return modules.flatMap((module) => module.chapters)[0]?.id ?? null;
}

export function getCourseLearningHref(
  courseId: string,
  modules: CourseNavigationModule[],
) {
  const firstChapterId = getFirstPublishedChapterId(modules);

  return firstChapterId
    ? `/courses/${courseId}/chapters/${firstChapterId}`
    : `/courses/${courseId}`;
}
