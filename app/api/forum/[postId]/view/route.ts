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

    const view = await prisma.forumView.upsert({
      where: {
        postId_userId: {
          postId: params.postId,
          userId: session.user.id,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        postId: params.postId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(view);
  } catch (error) {
    console.error("[FORUM_VIEW_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 