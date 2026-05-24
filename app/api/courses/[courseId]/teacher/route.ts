import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const session = await auth();
        const { teacherId } = await req.json();

        if (!session?.user || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const updatedCourse = await prisma.course.update({
            where: {
                id: params.courseId,
            },
            data: {
                teacherId,
            },
        });

        return NextResponse.json(updatedCourse);
    } catch (error) {
        console.error("[COURSE_TEACHER_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}