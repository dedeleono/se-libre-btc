import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function PATCH(
    req: Request,
) {
    const session = await auth()
    const { courseId, categoryIds } = await req.json()

    if (!courseId || !Array.isArray(categoryIds)) {
        return new NextResponse("Invalid", { status: 400 })
    }

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        // Clear existing categories associated with the course
        await prisma.courseCategory.deleteMany({
            where: {
                courseId: courseId,
            },
        })

        // Associate new categories
        const newCourseCategories = categoryIds.map((categoryId: string) => ({
            courseId: courseId,
            categoryId: categoryId,
        }))

        await prisma.courseCategory.createMany({
            data: newCourseCategories,
        })

        return new NextResponse("Unauthorized", { status: 201 })
    } catch (error) {
        console.error("Error updating categories:", error)
        return new NextResponse("An error occurred while updating categories", { status: 500 })
    }
}
