import { getChapters } from "@/actions/getChapters";
import { Banner } from "@/components/banner";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VideoPlayer } from "./_components/video-player";
import { ChapterType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { StudentAssignmentView } from "./_components/student-assignment-view";
import { ContentViewer } from "./_components/content-viewer";
import { isChapterAccessible } from "@/lib/chapter-access";
import { ChapterWithProgress } from "@/types/chapter";
import { CheckCircle } from "lucide-react";

const ChapterPage = async ({
  params,
}: {
  params: { courseId: string; chapterId: string };
}) => {
  const chapterIntro = await prisma.chapter.findUnique({
    where: {
      id: params.chapterId,
    },
    select: {
      isIntro: true,
    },
  });

  const session = await auth();

  if (!session?.user) {
    // For intro chapters, let the client-side handle the preview access
    if (chapterIntro?.isIntro) {
      const introChapter = await prisma.chapter.findUnique({
        where: {
          id: params.chapterId,
        },
        include: {
          module: {
            include: {
              course: true
            }
          },
          attachments: true
        }
      });

      if (!introChapter) {
        return redirect(`/courses/${params.courseId}`);
      }

      return (
        <div className="flex flex-col h-full">
          <ContentViewer
            videoUrl={introChapter.videoUrl}
            pdfUrl={introChapter.pdfUrl}
            richContent={introChapter.richContent}
            youtubeUrl={introChapter.youtubeUrl}
            title={introChapter.title}
            courseId={params.courseId}
            isLocked={false}
            lockType="intro"
            completeOnEnd={false}
            description={introChapter.description as string}
            attachments={introChapter.attachments}
            chapterId={introChapter.id}
            isAuthenticated={false}
          />
        </div>
      );
    }
    
    // For non-intro chapters, redirect to sign-in
    return redirect("/sign-in");
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      email: session.user.email!,
    },
  });

  if (!dbUser) {
    // If it's an intro chapter, render it even if dbUser doesn't exist
    if (chapterIntro?.isIntro) {
      // Fetch intro chapter data for rendering
      const introChapter = await prisma.chapter.findUnique({
        where: {
          id: params.chapterId,
        },
        include: {
          module: {
            include: {
              course: true
            }
          },
          attachments: true
        }
      });

      if (!introChapter) {
        return redirect(`/courses/${params.courseId}`);
      }

      return (
        <div className="flex flex-col h-full">
          <ContentViewer
            videoUrl={introChapter.videoUrl}
            pdfUrl={introChapter.pdfUrl}
            richContent={introChapter.richContent}
            youtubeUrl={introChapter.youtubeUrl}
            title={introChapter.title}
            courseId={params.courseId}
            isLocked={false}
            lockType="intro"
            completeOnEnd={false}
            description={introChapter.description as string}
            attachments={introChapter.attachments}
            chapterId={introChapter.id}
            isAuthenticated={false}
          />
        </div>
      );
    }
    
    // For non-intro chapters or if dbUser doesn't exist, redirect to sign-in
    return redirect("/sign-in");
  }

  const activeAcademicYear = await prisma.studentAcademicYear.findFirst({
    where: {
      studentId: dbUser.id,
      status: "ACTIVE",
    },
  });

  const hasValidAcademicYear = !!activeAcademicYear;

  const { nextChapter, studentProgress } = await getChapters({
    userId: dbUser.id,
    courseId: params.courseId,
    chapterId: params.chapterId,
  });

  const chapter = await prisma.chapter.findUnique({
    where: {
      id: params.chapterId,
    },
    include: {
      module: {
        include: {
          course: true
        }
      },
      studentProgress: {
        where: {
          userId: session.user.id
        }
      },
      assignments: {
        include: {
          questions: {
            include: {
              options: true,
              matchingConfig: true,
              matchingPrompts: true,
              matchingChoices: true,
              matchingPairs: true
            }
          },
          submissions: {
            where: {
              studentId: session.user.id
            }
          }
        }
      },
      attachments: true
    }
  });

  if (!chapter) {
    return redirect(`/courses/${params.courseId}`);
  }

  const isAccessible = await isChapterAccessible(
    chapter as ChapterWithProgress,
    session.user.id,
    session.user.role
  );

  if (!isAccessible) {
    return (
      <Banner
        label="Complete the previous chapter first to unlock this content."
        variant="warning"
      />
    );
  }

  if (
    (chapter.type === ChapterType.QUIZ ||
      chapter.type === ChapterType.ASSIGNMENT) &&
    !chapter.assignments[0]
  ) {
    return (
      <Banner
        label="This chapter is misconfigured. Please contact support."
        variant="warning"
      />
    );
  }

  const existingSubmission =
    chapter.type === ChapterType.QUIZ || chapter.type === ChapterType.ASSIGNMENT
      ? await prisma.submission.findFirst({
          where: {
            assignmentId: chapter.assignments[0].id,
            studentId: session.user.id,
          },
        })
      : null;
  

    // if (
    //   chapter.type === ChapterType.QUIZ ||
    //   chapter.type === ChapterType.ASSIGNMENT
    // ) {
    //   redirect(
    //     `/courses/${params.courseId}/chapters/${params.chapterId}/assignment`
    //   );
    // }

  const isPrivilegedUser = dbUser.role === "ADMIN" || dbUser.role === "TEACHER";

  // Check if current chapter has a completed submission (for quizzes/assignments)
  const hasCompletedAssignment = chapter.type !== "LESSON" 
    ? chapter.assignments[0]?.submissions.length > 0
    : true;

  const isChapterCompleted = chapter.studentProgress.length > 0;

  // Chapter is locked if previous chapter isn't completed
  // or if it's a quiz/assignment that hasn't been completed
  const isLocked = !isAccessible;

  const completeOnEnd = !!session.user && !studentProgress?.isCompleted;

     const renderChapterContent = () => {
       if (isLocked) {
         return (
           <Banner 
             variant="warning"
             label="Complete the previous chapter first to unlock this content."
           />
         );
       }

       switch (chapter.type) {
         case ChapterType.QUIZ:
         case ChapterType.ASSIGNMENT:
           return (
             <StudentAssignmentView
               assignment={{
                 ...chapter.assignments[0],
                 courseId: params.courseId,
                 chapterId: chapter.id
               }}
               existingSubmission={existingSubmission}
             />
           );
         default:
           return (
             <ContentViewer
               videoUrl={chapter.videoUrl}
               pdfUrl={chapter.pdfUrl}
               richContent={chapter.richContent}
               youtubeUrl={chapter.youtubeUrl}
               title={chapter.title}
               courseId={params.courseId}
               nextChapterId={nextChapter?.id}
               isLocked={false}
               completeOnEnd={completeOnEnd}
               description={chapter.description as string}
               attachments={chapter.attachments}
               chapterId={chapter.id}
             />
           );
       }
     };

  return (
    <div className="flex flex-col h-full">
      {studentProgress?.isCompleted && (
        <div className="sticky top-0 w-full border-t-0">
          <Banner 
            label="¡Has completado esta lección!" 
            variant="success"
          />
        </div>
      )}
      {renderChapterContent()}
    </div>
  );
};

export default ChapterPage;

export const revalidate = 0;