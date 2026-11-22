import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const authz = await requireAdminApi();
        if (!authz.ok) return authz.response;

        const { title, content, learningPathId, cohortId, courseId, meetingLink, meetingDate } = await req.json();

        const post = await prisma.forumPost.create({
            data: {
                title,
                content,
                authorId: authz.session.user.id,
                learningPathId: learningPathId || null,
                cohortId: cohortId || null,
                courseId: courseId || null,
                meetingLink: meetingLink || null,
                meetingDate: meetingDate ? new Date(meetingDate) : null,
            },
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error("[FORUM_POST_CREATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
