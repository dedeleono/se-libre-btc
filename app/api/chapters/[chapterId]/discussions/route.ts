import { auth } from "@/lib/auth";
import { hasCourseEnrollmentAccess } from "@/lib/chapter-access";
import { prisma } from "@/lib/db";
import { publicAuthorSelect } from "@/lib/public-author";
import { NextResponse } from "next/server";

type ChapterAccess = { ok: true } | { ok: false; response: NextResponse };

async function checkChapterAccess(
  user: { id: string; role: string },
  chapterId: string
): Promise<ChapterAccess> {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { module: { select: { courseId: true } } },
  });

  if (!chapter) {
    return { ok: false, response: new NextResponse("Chapter not found", { status: 404 }) };
  }

  if (user.role !== "ADMIN" && !(await hasCourseEnrollmentAccess(user.id, chapter.module.courseId))) {
    return { ok: false, response: new NextResponse("Forbidden", { status: 403 }) };
  }

  return { ok: true };
}

export async function POST(req: Request, props: { params: Promise<{ chapterId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const access = await checkChapterAccess(session.user, params.chapterId);
    if (!access.ok) return access.response;

    const { content } = await req.json();

    const discussion = await prisma.chapterDiscussion.create({
      data: {
        content,
        authorId: session.user.id,
        chapterId: params.chapterId,
      },
      include: {
        author: { select: publicAuthorSelect },
      },
    });

    return NextResponse.json(discussion);
  } catch (error) {
    console.error("[CHAPTER_DISCUSSION_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request, props: { params: Promise<{ chapterId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const access = await checkChapterAccess(session.user, params.chapterId);
    if (!access.ok) return access.response;

    const discussions = await prisma.chapterDiscussion.findMany({
      where: {
        chapterId: params.chapterId,
      },
      include: {
        author: { select: publicAuthorSelect },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(discussions);
  } catch (error) {
    console.error("[CHAPTER_DISCUSSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
