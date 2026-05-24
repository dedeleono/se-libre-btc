import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: { studentId: string } }
) {
    try {
        const student = await prisma.user.findUnique({
            where: {
                id: params.studentId,
            },
            include: {
                studentCourses: {
                    include: {
                        course: true,
                    },
                },
            },
        });

        return NextResponse.json(student?.studentCourses || []);
    } catch (error) {
        console.error("[STUDENT_COURSES]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}