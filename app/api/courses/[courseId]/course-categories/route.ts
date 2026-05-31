import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import * as z from "zod"

const updateCourseCategoriesSchema = z.object({
    courseId: z.string().min(1),
    categoryIds: z.array(z.string().min(1)),
})

export async function PATCH(
    req: Request,
) {
    const session = await auth()

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }
    if (session.user.role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const { courseId, categoryIds } = updateCourseCategoriesSchema.parse(await req.json())

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

        if (newCourseCategories.length > 0) {
            await prisma.courseCategory.createMany({
                data: newCourseCategories,
            })
        }

        return NextResponse.json({ success: true }, { status: 201 })
    } catch (error) {
        console.error("Error updating categories:", error)
        return new NextResponse("An error occurred while updating categories", { status: 500 })
    }
}
