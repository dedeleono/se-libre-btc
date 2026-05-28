import { Chapter, ChapterProgress, Quiz } from "@prisma/client";

export type ChapterWithProgress = Chapter & {
  module?: {
    courseId: string;
  };
  studentProgress?: ChapterProgress[];
  quiz?: Quiz | null;
};