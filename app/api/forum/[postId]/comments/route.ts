import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userCanReadForumPost } from "@/lib/forum-post-access";
import { publicAuthorSelect } from "@/lib/public-author";

const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(10000),
  parentId: z.string().min(1).nullish(),
});

export async function POST(req: Request, props: { params: Promise<{ postId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const parsed = createCommentSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
    }
    const { content, parentId } = parsed.data;

    const post = await prisma.forumPost.findUnique({
      where: { id: params.postId },
      select: { id: true, courseId: true, learningPathId: true, cohortId: true },
    });

    if (!post) {
      return new NextResponse("Forum post not found", { status: 404 });
    }

    if (!(await userCanReadForumPost(session.user, post))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (parentId) {
      const parent = await prisma.forumReply.findFirst({
        where: { id: parentId, postId: post.id },
        select: { id: true },
      });
      if (!parent) {
        return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
      }
    }

    const comment = await prisma.forumReply.create({
      data: {
        content,
        authorId: session.user.id,
        postId: post.id,
        parentId: parentId ?? null,
      },
      include: {
        author: { select: publicAuthorSelect },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[FORUM_COMMENT_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
