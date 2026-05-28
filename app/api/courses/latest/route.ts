import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const latestCourses = await prisma.course.findMany({
            where: {
                isPublished: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 4,
            select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
            }
        })

        return NextResponse.json(latestCourses)
    } catch (error) {
        console.log("[LATEST_COURSES]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
