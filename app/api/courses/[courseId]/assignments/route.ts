import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const course = await prisma.course.findUnique({
            where: {
                id: params.courseId,
            },
            include: {
                levelCourses: {
                    include: {
                        level: {
                            include: {
                                students: true,
                            },
                        },
                    },
                },
                studentCourses: {
                    include: {
                        student: true,
                    },
                },
            },
        });

        return NextResponse.json(course);
    } catch (error) {
        console.error("[COURSE_ASSIGNMENTS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}