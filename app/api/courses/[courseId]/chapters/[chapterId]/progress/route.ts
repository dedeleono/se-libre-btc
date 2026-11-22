import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProgress } from "@/actions/get-progress";
import { hasCourseEnrollmentAccess } from "@/lib/chapter-access";
import { decideChapterWrite } from "@/lib/chapter-write-policy";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const isAdmin = session.user.role === "ADMIN";

    const [chapter, hasEnrollment] = await Promise.all([
      prisma.chapter.findUnique({
        where: { id: params.chapterId },
        select: { type: true, isPublished: true, isIntro: true, module: { select: { courseId: true } } },
      }),
      isAdmin ? true : hasCourseEnrollmentAccess(userId, params.courseId),
    ]);

    const decision = decideChapterWrite({
      chapter: chapter && {
        courseId: chapter.module.courseId,
        type: chapter.type,
        isPublished: chapter.isPublished,
        isIntro: chapter.isIntro,
      },
      expectedCourseId: params.courseId,
      isAdmin,
      hasEnrollment,
      action: "COMPLETE_CHAPTER",
    });
    if (!decision.ok) return new NextResponse(decision.reason, { status: decision.status });

    const now = new Date();

    const progress = await prisma.chapterProgress.upsert({
      where: { userId_chapterId: { userId, chapterId: params.chapterId } },
      create: { userId, chapterId: params.chapterId, isCompleted: true, completedAt: now },
      update: { isCompleted: true, completedAt: now },
    });

    // Record course-level completion exactly once.
    const percent = await getProgress(userId, params.courseId);
    if (percent >= 100) {
      await prisma.courseEnrollment.updateMany({
        where: { userId, courseId: params.courseId, completedAt: null },
        data: { completedAt: now },
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("[CHAPTER_PROGRESS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
