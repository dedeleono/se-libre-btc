import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { createCourse } from "@/actions/course";

export async function POST(req: Request) {
    try {
        const authz = await requireAdminApi();
        if (!authz.ok) return authz.response;

        const courseData = await req.json();
        const course = await createCourse(courseData);

        return NextResponse.json(course);
    } catch (error) {
        console.error("[COURSES]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}