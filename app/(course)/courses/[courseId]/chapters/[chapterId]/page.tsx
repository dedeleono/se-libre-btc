import { getChapters } from "@/actions/getChapters";
import { Banner } from "@/components/banner";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChapterType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ContentViewer } from "./_components/content-viewer";
import { isChapterAccessible } from "@/lib/chapter-access";
import { ChapterWithProgress } from "@/types/chapter";
import { QuizPlayer } from "./_components/quiz-player";
import { getServerMessages } from "@/lib/i18n-server";

const ChapterPage = async ({
  params,
}: {
  params: { courseId: string; chapterId: string };
}) => {
  const t = getServerMessages();
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
      quiz: {
        include: {
          questions: {
            include: { options: true },
            orderBy: { position: "asc" },
          }
        }
      },
      liveSession: true,
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
        label={t.course.completePrevious}
        variant="warning"
      />
    );
  }

  if (chapter.type === ChapterType.QUIZ && !chapter.quiz) {
    return <Banner label={t.course.quizNotConfigured} variant="warning" />;
  }

  const isLocked = !isAccessible;
  const completeOnEnd = !!session.user && !studentProgress?.isCompleted;

     const renderChapterContent = () => {
       if (isLocked) {
         return (
           <Banner 
             variant="warning"
             label={t.course.completePrevious}
           />
         );
       }

              switch (chapter.type) {
       case ChapterType.QUIZ:
         return (
           <QuizPlayer
             quiz={chapter.quiz!}
             courseId={params.courseId}
             nextChapterId={nextChapter?.id}
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
            label={t.course.lessonCompleted} 
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
