import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(
    req: Request,
    { params }: { params: { studentId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { levelId } = await req.json();

        const result = await prisma.$transaction(async (tx) => {
            // 1. Assign student to level
            const updatedStudent = await tx.user.update({
                where: { id: params.studentId },
                data: { levelId },
            });

            // 2. Get all courses for this level
            const levelCourses = await tx.levelCourse.findMany({
                where: { levelId },
                include: { course: true },
            });

            // 3. Create StudentCourse entries
            const studentCoursePromises = levelCourses.map((levelCourse) =>
                tx.studentCourse.upsert({
                    where: {
                        studentId_courseId: {
                            studentId: params.studentId,
                            courseId: levelCourse.courseId,
                        },
                    },
                    create: {
                        studentId: params.studentId,
                        courseId: levelCourse.courseId,
                        isAssignedByLevel: true,
                    },
                    update: {
                        isAssignedByLevel: true,
                    },
                })
            );

            const createdCourses = await Promise.all(studentCoursePromises);

            return {
                student: updatedStudent,
                assignedCourses: createdCourses,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("[STUDENT_LEVEL]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}