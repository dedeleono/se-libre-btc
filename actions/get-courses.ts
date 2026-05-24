import { Category, Course } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getProgress } from "@/actions/get-progress";

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
                title: {
                    contains: title,
                    mode: 'insensitive',
                },
                courseCategory: categoryId ? {
                    some: {
                        categoryId: categoryId,
                    }
                } : undefined,
            },
            include: {
                courseCategory: {
                    include: {
                        category: true,
                    }
                },
                modules: {
                    include: {
                        chapters: {
                            where: {
                                isPublished: true,
                            },
                            orderBy: {
                                position: 'asc',
                            },
                            select: {
                                id: true,
                            }
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            }
        });

        const coursesWithProgress: CourseWithProgressWithCategory[] = await Promise.all(courses.map(async (course) => { 
            const progress = await getProgress(userId, course.id);
            return {
                ...course,
                progress: progress,
            }
        }));

        return coursesWithProgress;
    } catch (error) {
        console.log("[GET_COURSES]", error);
        return [];
    }
}