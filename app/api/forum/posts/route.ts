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

        const post = await prisma.forumPost.create({
            data: {
                title,
                content,
                authorId: user.id,
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
