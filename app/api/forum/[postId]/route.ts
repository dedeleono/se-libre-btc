import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
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

    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete all related records in a transaction
    await prisma.$transaction([
      // Delete all views
      prisma.forumView.deleteMany({
        where: { postId: params.postId }
      }),
      // Delete all replies (comments)
      prisma.forumReply.deleteMany({
        where: { postId: params.postId }
      }),
      // Delete the post itself
      prisma.forumPost.delete({
        where: { id: params.postId }
      })
    ]);

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("[FORUM_POST_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
