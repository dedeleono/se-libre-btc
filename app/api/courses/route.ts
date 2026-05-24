import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCourse } from "@/actions/course";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { levelId, teacherId, ...courseData } = await req.json();

        // Only allow teacherId to be set if the user is an ADMIN
        if (teacherId && session.user.role !== "ADMIN") {
            return new NextResponse("Forbidden: Only admins can assign teachers", { status: 403 });
        }

        const course = await createCourse(
            { ...courseData, teacherId },
            levelId
        );

        return NextResponse.json(course);
    } catch (error) {
        console.error("[COURSES]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}