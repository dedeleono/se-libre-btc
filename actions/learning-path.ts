"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")

export async function getLearningPaths() {
    return prisma.learningPath.findMany({
        include: {
            courses: { include: { course: true }, orderBy: { position: "asc" } },
            enrollments: true,
        },
        orderBy: { position: "asc" },
    })
}

export async function createLearningPath(title: string) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    const position = await prisma.learningPath.count()
    const learningPath = await prisma.learningPath.create({
        data: {
            title,
            slug: slugify(title) || `learning-path-${Date.now()}`,
            position,
        },
    })

    revalidatePath("/admin/learning-paths")
    return learningPath
}

export async function enrollStudentInLearningPath(userId: string, learningPathId: string) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    const pathCourses = await prisma.learningPathCourse.findMany({ where: { learningPathId } })

    await prisma.$transaction([
        prisma.learningPathEnrollment.upsert({
            where: { userId_learningPathId: { userId, learningPathId } },
            create: { userId, learningPathId, source: "ADMIN" },
            update: { status: "ACTIVE" },
        }),
        ...pathCourses.map((pathCourse) =>
            prisma.courseEnrollment.upsert({
                where: { userId_courseId: { userId, courseId: pathCourse.courseId } },
                create: { userId, courseId: pathCourse.courseId, source: "LEARNING_PATH" },
                update: { status: "ACTIVE" },
            })
        ),
    ])

    revalidatePath("/admin/students")
}

export async function deleteLearningPath(learningPathId: string) {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    await prisma.learningPath.delete({ where: { id: learningPathId } })
    revalidatePath("/admin/learning-paths")
}
