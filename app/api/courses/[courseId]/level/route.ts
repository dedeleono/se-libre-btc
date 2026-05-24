import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function POST(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true }
        });

        if (!user || user.role !== UserRole.ADMIN) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { levelId } = await req.json();

        if (!levelId) {
            return new NextResponse("Level ID is required", { status: 400 });
        }

        // First, remove any existing level assignments for this course
        await prisma.levelCourse.deleteMany({
            where: {
                courseId: params.courseId
            }
        });

        // Create new level assignment
        const levelCourse = await prisma.levelCourse.create({
            data: {
                courseId: params.courseId,
                levelId: levelId
            }
        });

        return NextResponse.json(levelCourse);
    } catch (error) {
        console.log("[COURSE_LEVEL_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}