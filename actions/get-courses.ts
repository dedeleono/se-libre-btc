import { Category, Course } from "@prisma/client";

import { progressPercent } from "@/lib/course-progress";
import { prisma } from "@/lib/db";

type CourseWithProgressWithCategory = Course & {
    category?: Category | null;
    chapters?: { id: string }[];
    isEnrolled: boolean;
    progress?: number | null;
}

type GetCourses = {
    userId?: string;
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
                enrollments: {
                    where: {
                        userId: userId ?? "__anonymous__",
                        status: { in: ["ACTIVE", "COMPLETED"] },
                    },
                    select: { id: true },
                },
                modules: {
                    include: {
                        chapters: {
                            where: { isPublished: true },
                            orderBy: { position: 'asc' },
                            select: { id: true },
                        },
                    },
                    // Order by position so chapters[0] resolves to the canonical
                    // first chapter (matches the course redirect + dashboard).
                    orderBy: { position: 'asc' },
                },
            }
        });

        const enrolledChapterIds = userId
            ? courses
                .filter((course) => course.enrollments.length > 0)
                .flatMap((course) => course.modules.flatMap((module) => module.chapters.map((chapter) => chapter.id)))
            : [];

        const completed = enrolledChapterIds.length > 0
            ? await prisma.chapterProgress.findMany({
                where: { userId, isCompleted: true, chapterId: { in: enrolledChapterIds } },
                select: { chapterId: true },
            })
            : [];
        const completedChapterIds = new Set(completed.map((row) => row.chapterId));

        return courses.map((course) => {
            const chapters = course.modules.flatMap((module) => module.chapters);
            const category = course.courseCategory[0]?.category ?? null;
            const isEnrolled = course.enrollments.length > 0;

            return {
                ...course,
                category,
                chapters,
                isEnrolled,
                progress: userId && isEnrolled
                    ? progressPercent(chapters.filter((chapter) => completedChapterIds.has(chapter.id)).length, chapters.length)
                    : null,
            };
        });
    } catch (error) {
        console.log("[GET_COURSES]", error);
        return [];
    }
}
