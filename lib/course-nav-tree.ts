import type { ChapterType } from "@prisma/client";

// The course outline the browser receives. Anything added here is sent to
// every viewer of the course shell, so lesson content never belongs in it.
export type CourseNavChapter = {
  id: string;
  title: string;
  type: ChapterType;
  isIntro: boolean;
  isPublished: boolean;
  isCompleted: boolean;
};

export type CourseNavModule = { id: string; title: string; chapters: CourseNavChapter[] };

export type CourseNavTree = { id: string; title: string; modules: CourseNavModule[] };

export function toCourseNavTree(row: {
  id: string;
  title: string;
  modules: {
    id: string;
    title: string;
    chapters: {
      id: string;
      title: string;
      type: ChapterType;
      isIntro: boolean;
      isPublished: boolean;
      studentProgress?: { isCompleted: boolean }[] | null;
    }[];
  }[];
}): CourseNavTree {
  return {
    id: row.id,
    title: row.title,
    modules: row.modules.map((module) => ({
      id: module.id,
      title: module.title,
      chapters: module.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        type: chapter.type,
        isIntro: chapter.isIntro,
        isPublished: chapter.isPublished,
        isCompleted: chapter.studentProgress?.[0]?.isCompleted === true,
      })),
    })),
  };
}

const chaptersInOrder = (tree: CourseNavTree) => tree.modules.flatMap((module) => module.chapters);

export function findChapter(tree: CourseNavTree, chapterId: string): CourseNavChapter | null {
  return chaptersInOrder(tree).find((chapter) => chapter.id === chapterId) ?? null;
}

export function findNextPublishedChapterId(tree: CourseNavTree, chapterId: string): string | null {
  const chapters = chaptersInOrder(tree);
  const index = chapters.findIndex((chapter) => chapter.id === chapterId);
  if (index === -1) return null;
  return chapters.slice(index + 1).find((chapter) => chapter.isPublished)?.id ?? null;
}

export function countChapters(tree: CourseNavTree): number {
  return chaptersInOrder(tree).length;
}

export function countCompletedChapters(tree: CourseNavTree): number {
  return chaptersInOrder(tree).filter((chapter) => chapter.isCompleted).length;
}
