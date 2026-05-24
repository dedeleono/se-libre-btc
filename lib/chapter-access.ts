import { prisma } from "@/lib/db";
import { ChapterWithProgress } from "@/types/chapter";

export const isChapterAccessible = async (
  chapter: ChapterWithProgress,
  userId: string | null,
  userRole: string | null
): Promise<boolean> => {
  // Allow public access to intro chapters
  if (chapter.isIntro) {
    return true;
  }

  // Require authentication for non-intro chapters
  if (!userId || !userRole) {
    return false;
  }

  // Teachers and admins always have access
  if (userRole === "ADMIN" || userRole === "TEACHER") {
    return true;
  }

  if (!chapter.module?.courseId) {
    return false;
  }

  // Check if current chapter is already completed
  const currentProgress = await prisma.chapterProgress.findUnique({
    where: {
      userId_chapterId: {
        userId,
        chapterId: chapter.id,
      },
    },
  });

  // If the chapter is already completed, allow access
  if (currentProgress?.isCompleted) {
    return true;
  }

  // Get the current module and its position
  const currentModule = await prisma.courseModule.findUnique({
    where: { id: chapter.moduleId },
    select: { position: true, courseId: true }
  });

  if (!currentModule) {
    return false;
  }

  // Find the previous chapter
  const previousChapter = await prisma.chapter.findFirst({
    where: {
      OR: [
        {
          moduleId: chapter.moduleId,
          position: { lt: chapter.position }
        },
        {
          module: {
            courseId: currentModule.courseId,
            position: { lt: currentModule.position }
          }
        }
      ],
      isPublished: true
    },
    include: {
      studentProgress: {
        where: {
          userId,
          isCompleted: true
        }
      },
      assignments: {
        include: {
          submissions: {
            where: {
              studentId: userId
            }
          }
        }
      }
    },
    orderBy: [
      { module: { position: 'desc' } },
      { position: 'desc' }
    ]
  });

  // First chapter is always accessible
  if (!previousChapter) {
    return true;
  }

  // Check if previous chapter is completed
  const isPreviousCompleted = previousChapter.studentProgress.length > 0;

  // For previous assignments/quizzes, check if they're submitted (not necessarily graded)
  if (previousChapter.type !== "LESSON") {
    const hasSubmission = previousChapter.assignments?.[0]?.submissions.length > 0;
    return isPreviousCompleted && hasSubmission;
  }

  return isPreviousCompleted;
}; 