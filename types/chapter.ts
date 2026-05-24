import { Chapter, ChapterProgress, Assignment, Submission } from "@prisma/client";

export type ChapterWithProgress = Chapter & {
  module?: {
    courseId: string;
  };
  studentProgress?: ChapterProgress[];
  assignments?: (Assignment & {
    submissions: Submission[];
  })[];
}; 