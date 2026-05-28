import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { postId: string } }
) {
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

    const { content, parentId } = await req.json();
    const { postId } = params;

    // Verify user has access to this forum post
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        learningPath: true,
        cohort: true,
        course: true,
      },
    });

    if (!post) {
      return new NextResponse("Forum post not found", { status: 404 });
    }

    // Check if user has access to this post
    if (user.role === "STUDENT") {
      const [courseEnrollment, learningPathEnrollment, cohortEnrollment] = await Promise.all([
        post.courseId
          ? prisma.courseEnrollment.findUnique({
              where: {
                userId_courseId: {
                  userId: user.id,
                  courseId: post.courseId,
                },
              },
            })
          : null,
        post.learningPathId
          ? prisma.learningPathEnrollment.findUnique({
              where: {
                userId_learningPathId: {
                  userId: user.id,
                  learningPathId: post.learningPathId,
                },
              },
            })
          : null,
        post.cohortId
          ? prisma.cohortEnrollment.findUnique({
              where: {
                userId_cohortId: {
                  userId: user.id,
                  cohortId: post.cohortId,
                },
              },
            })
          : null,
      ]);

      if (!courseEnrollment && !learningPathEnrollment && !cohortEnrollment) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const comment = await prisma.forumReply.create({
      data: {
        content,
        authorId: user.id,
        postId,
        parentId: parentId || null,
      },
      include: {
        author: true,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[FORUM_COMMENT_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const comments = await prisma.forumReply.findMany({
      where: {
        postId: params.postId,
        parentId: null, // Only get top-level comments
      },
      include: {
        author: true,
        replies: {
          include: {
            author: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[FORUM_COMMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
