import { Banner } from "@/components/banner";
import { EnrollmentButton } from "@/components/enrollment-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChapterType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ContentViewer } from "./_components/content-viewer";
import { hasCourseEnrollmentAccess } from "@/lib/chapter-access";
import { resolveChapterAccess } from "@/lib/chapter-access-rule";
import { findChapter, findNextPublishedChapterId } from "@/lib/course-nav-tree";
import { getCourseNavTree } from "@/lib/get-course-nav-tree";
import { QuizPlayer } from "./_components/quiz-player";
import { toQuizForPlayer } from "@/lib/quiz-dto";
import { getServerMessages } from "@/lib/i18n-server";

const ChapterPage = async (
  props: {
    params: Promise<{ courseId: string; chapterId: string }>;
  }
) => {
  const params = await props.params;
  const t = await getServerMessages();
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const role = session?.user?.role ?? null;
  const isAdmin = role === "ADMIN";

  // The outline query is shared with the course layout through React cache().
  const [tree, hasEnrollment] = await Promise.all([
    getCourseNavTree(params.courseId, userId, isAdmin),
    userId && !isAdmin
      ? hasCourseEnrollmentAccess(userId, params.courseId)
      : Promise.resolve(false),
  ]);
  const navChapter = tree ? findChapter(tree, params.chapterId) : null;
  if (!tree || !navChapter) {
    return redirect(`/courses/${params.courseId}`);
  }

  const access = resolveChapterAccess({
    isAuthenticated: !!userId,
    role,
    isIntro: navChapter.isIntro,
    hasEnrollment,
  });
  if (!access.accessible) {
    if (access.reason === "SIGN_IN_REQUIRED") {
      return redirect("/sign-in");
    }
    return (
      <div className="flex flex-col">
        <Banner
          label={tree.isFree ? t.course.enrollToAccess : t.course.enrollInCourseToAccess}
          variant="warning"
        />
        <div className="flex justify-center p-6">
          {tree.isFree ? (
            <EnrollmentButton productId={params.courseId} productType="course">
              {t.course.enrollForFree}
            </EnrollmentButton>
          ) : (
            <Button asChild>
              <Link href={`/courses/preview/${params.courseId}`}>{t.public.viewCourse}</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  const chapter = await prisma.chapter.findFirst({
    where: { id: params.chapterId, module: { courseId: params.courseId } },
    select: {
      id: true,
      title: true,
      type: true,
      description: true,
      videoUrl: true,
      pdfUrl: true,
      richContent: true,
      youtubeUrl: true,
      hasWalletSimulator: true,
      attachments: true,
      quiz: {
        select: {
          id: true,
          title: true,
          description: true,
          allowRetries: true,
          questions: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              prompt: true,
              type: true,
              metadata: true,
              options: {
                orderBy: { position: "asc" },
                select: { id: true, content: true, isCorrect: true },
              },
            },
          },
        },
      },
    },
  });

  if (!chapter) {
    return redirect(`/courses/${params.courseId}`);
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col h-full">
        <ContentViewer
          videoUrl={chapter.videoUrl}
          pdfUrl={chapter.pdfUrl}
          richContent={chapter.richContent}
          youtubeUrl={chapter.youtubeUrl}
          title={chapter.title}
          courseId={params.courseId}
          lockType="intro"
          completeOnEnd={false}
          description={chapter.description as string}
          attachments={chapter.attachments}
          chapterId={chapter.id}
          isAuthenticated={false}
        />
      </div>
    );
  }

  if (chapter.type === ChapterType.QUIZ && !chapter.quiz) {
    return <Banner label={t.course.quizNotConfigured} variant="warning" />;
  }

  const nextChapterId = findNextPublishedChapterId(tree, chapter.id) ?? undefined;
  const isCompleted = navChapter.isCompleted;

  return (
    <div className="flex flex-col h-full">
      {isCompleted && (
        <div className="sticky top-0 w-full border-t-0">
          <Banner
            label={t.course.lessonCompleted}
            variant="success"
          />
        </div>
      )}
      {chapter.type === ChapterType.QUIZ ? (
        <QuizPlayer
          quiz={toQuizForPlayer(chapter.quiz!)}
          courseId={params.courseId}
          nextChapterId={nextChapterId}
        />
      ) : (
        <ContentViewer
          videoUrl={chapter.videoUrl}
          pdfUrl={chapter.pdfUrl}
          richContent={chapter.richContent}
          youtubeUrl={chapter.youtubeUrl}
          title={chapter.title}
          courseId={params.courseId}
          nextChapterId={nextChapterId}
          completeOnEnd={!isCompleted}
          description={chapter.description as string}
          attachments={chapter.attachments}
          chapterId={chapter.id}
          hasWalletSimulator={chapter.hasWalletSimulator}
        />
      )}
    </div>
  );
};

export default ChapterPage;

export const revalidate = 0;
