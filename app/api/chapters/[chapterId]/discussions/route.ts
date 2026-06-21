import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, props: { params: Promise<{ chapterId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { content } = await req.json();
    const { chapterId } = params;

    // Verify user has access to this chapter
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        module: {
          include: {
            course: true
          }
        }
      },
    });

    if (!chapter) {
      return new NextResponse("Chapter not found", { status: 404 });
    }

    // Check if user has access to this chapter
    if (user.role === "STUDENT") {
      const hasAccess = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: chapter.module.course.id,
          }
        },
      });

      if (!hasAccess) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    console.log("Prisma client:", prisma);
    console.log("ChapterDiscussion model:", prisma.chapterDiscussion);

    const discussion = await prisma.chapterDiscussion.create({
      data: {
        content,
        authorId: user.id,
        chapterId,
      },
      include: {
        author: true,
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

    const discussions = await prisma.chapterDiscussion.findMany({
      where: {
        chapterId: params.chapterId,
      },
      include: {
        author: true,
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
