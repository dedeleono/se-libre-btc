import { Category, Course } from "@prisma/client";

import { getProgress } from "@/actions/get-progress";
import { prisma } from "@/lib/db";

type CourseWithProgressWithCategory = Course & {
    category?: Category | null;
    chapters?: { id: string }[];
    progress?: number | null;
}

type GetCourses = {
    userId: string;
    title?: string;
    categoryId?: string;
}

export const getCourses = async ({ userId, categoryId, title }: GetCourses): Promise<CourseWithProgressWithCategory[]> => {
    try {
        const courses = await prisma.course.findMany({
            where: {
                isPublished: true,
                title: title ? { contains: title, mode: 'insensitive' } : undefined,
                courseCategory: categoryId ? { some: { categoryId } } : undefined,
            },
            include: {
                courseCategory: { include: { category: true } },
                modules: {
                    include: {
                        chapters: {
                            where: { isPublished: true },
                            orderBy: { position: 'asc' },
                            select: { id: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            }
        });

        return Promise.all(courses.map(async (course) => ({
            ...course,
            progress: await getProgress(userId, course.id),
        })));
    } catch (error) {
        console.log("[GET_COURSES]", error);
        return [];
    }
}