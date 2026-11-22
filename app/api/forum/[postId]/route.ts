import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, props: { params: Promise<{ postId: string }> }) {
  const params = await props.params;
  try {
    const authz = await requireAdminApi();
    if (!authz.ok) return authz.response;

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
