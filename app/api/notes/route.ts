import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasCourseEnrollmentAccess } from "@/lib/chapter-access";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { content, chapterId, courseId } = body;

    if (!content || !chapterId || !courseId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, module: { courseId } },
      select: { id: true },
    });

    if (!chapter) {
      return new NextResponse("Chapter not found", { status: 404 });
    }

    if (session.user.role !== "ADMIN" && !(await hasCourseEnrollmentAccess(session.user.id, courseId))) {
      return new NextResponse("Not enrolled in this course", { status: 403 });
    }

    // Create or update the note
    const note = await prisma.studentNote.upsert({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId: chapterId,
        },
      },
      create: {
        content,
        userId: session.user.id,
        chapterId,
        courseId,
      },
      update: {
        content,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId");

    if (!chapterId) {
      return new NextResponse("Chapter ID is required", { status: 400 });
    }

    const note = await prisma.studentNote.findUnique({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId: chapterId,
        },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 