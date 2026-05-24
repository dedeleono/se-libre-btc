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

        if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { title, content, levelId, courseId, meetLink } = await req.json();

        const post = await prisma.forumPost.create({
            data: {
                title,
                content,
                authorId: user.id,
                levelId: levelId || null,
                courseId: courseId || null,
                meetingLink: meetLink || null,
            },
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error("[FORUM_POST_CREATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}