import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, props: { params: Promise<{ studentId: string }> }) {
    const params = await props.params;
    try {
        const student = await prisma.user.findUnique({
            where: {
                id: params.studentId,
            },
            include: {
                courseEnrollments: {
                    include: {
                        course: true,
                    },
                },
            },
        });

        return NextResponse.json(student?.courseEnrollments || []);
    } catch (error) {
        console.error("[STUDENT_COURSES]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}