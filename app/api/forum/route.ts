import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, content, learningPathId, cohortId, courseId, meetingLink, meetingDate } = await req.json();

    const forumPost = await prisma.forumPost.create({
      data: {
        title,
        content,
        authorId: user.id,
        learningPathId,
        cohortId,
        courseId: courseId || null,
        meetingLink: meetingLink || null,
        meetingDate: meetingDate ? new Date(meetingDate) : null,
      },
    });

    return NextResponse.json(forumPost);
  } catch (error) {
    console.error("[FORUM_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        learningPathEnrollments: true,
        courseEnrollments: true,
        cohortEnrollments: true,
      },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let forums;
    if (user.role === "ADMIN") {
      forums = await prisma.forumPost.findMany({
        include: {
          author: true,
          learningPath: true,
          cohort: true,
          course: true,
          comments: {
            include: {
              author: true,
              replies: {
                include: {
                  author: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              views: true
            }
          }
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      forums = await prisma.forumPost.findMany({
        where: {
          OR: [
            { learningPathId: { in: user.learningPathEnrollments.map((enrollment) => enrollment.learningPathId) } },
            { cohortId: { in: user.cohortEnrollments.map((enrollment) => enrollment.cohortId) } },
            { courseId: { in: user.courseEnrollments.map((enrollment) => enrollment.courseId) } },
          ],
        },
        include: {
          author: true,
          learningPath: true,
          cohort: true,
          course: true,
          comments: {
            include: {
              author: true,
              replies: {
                include: {
                  author: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              views: true
            }
          }
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json(forums);
  } catch (error) {
    console.error("[FORUMS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 