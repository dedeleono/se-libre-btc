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
  const session = await auth();

  if (!session?.user) {
    // For unauthenticated visitors we still need to know if this is an intro
    // chapter; fetch only the minimal field needed for that decision.
    const chapterIntro = await prisma.chapter.findUnique({
      where: { id: params.chapterId },
      select: { isIntro: true },
    });

    if (chapterIntro?.isIntro) {
      const introChapter = await prisma.chapter.findUnique({
        where: { id: params.chapterId },
        include: {
          module: { include: { course: true } },
          attachments: true,
        },
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

    // Non-intro chapter: redirect to sign-in
    return redirect("/sign-in");
  }

  // Authenticated path: fetch chapter (full include), nextChapter id, and
  // studentProgress concurrently — three parallel round-trips instead of a
  // sequential waterfall of ~50.
  const userId = session.user.id;

  const [chapter, nextChapter, studentProgress] = await Promise.all([
    prisma.chapter.findUnique({
      where: { id: params.chapterId },
      include: {
        module: { include: { course: true } },
        studentProgress: { where: { userId } },
        quiz: {
          include: {
            questions: {
              include: { options: true },
              orderBy: { position: "asc" },
            },
          },
        },
        liveSession: true,
        attachments: true,
      },
    }),
    // Cheapest possible next-chapter lookup: one indexed query, returns only id.
    // Requires chapter.moduleId + chapter.position — we derive them from the
    // chapter fetch above. Because Promise.all runs them concurrently we pass a
    // nested sub-promise that waits for the minimal fields first.
    prisma.chapter
      .findUnique({
        where: { id: params.chapterId },
        select: { moduleId: true, position: true },
      })
      .then((c) =>
        c
          ? prisma.chapter.findFirst({
              where: {
                moduleId: c.moduleId,
                position: { gt: c.position },
                isPublished: true,
              },
              orderBy: { position: "asc" },
              select: { id: true },
            })
          : null
      ),
    prisma.chapterProgress.findUnique({
      where: { userId_chapterId: { userId, chapterId: params.chapterId } },
    }),
  ]);

  if (!chapter) {
    // If no session user in DB (edge case: session exists but user deleted),
    // fall through to sign-in for non-intro chapters. For intro we already
    // handled the unauthenticated branch above; if we reach here authenticated
    // but chapter missing just redirect to course root.
    return redirect(`/courses/${params.courseId}`);
  }

  // If the chapter turns out to be an intro and somehow an authenticated user
  // landed here without a corresponding DB record, guard gracefully.
  if (chapter.isIntro && !session.user.id) {
    return redirect("/sign-in");
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
            hasWalletSimulator={chapter.hasWalletSimulator}
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
