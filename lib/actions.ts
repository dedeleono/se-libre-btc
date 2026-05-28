'use server'

import { cache } from 'react'
import { cookies } from 'next/headers'

import { prisma } from '@/lib/db'

export async function getAuthToken() {
    const cookieStore = cookies()
    return cookieStore.get('dashboard-auth')?.value
}

export const getCachedDashboardData = cache(async () => {
    const [totalStudents, activeCourses, pendingReviews] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.course.count({ where: { isPublished: true } }),
        prisma.quizAttempt.count({ where: { status: 'COMPLETED', passed: false } }),
    ])

    return {
        totalStudents,
        activeCourses,
        pendingReviews,
    }
})

export const getCachedCoursesActivity = cache(async () => {
    const courses = await prisma.course.findMany({
        select: {
            id: true,
            title: true,
            enrollments: { select: { id: true } },
            modules: {
                select: {
                    id: true,
                    title: true,
                    chapters: {
                        select: {
                            id: true,
                            studentProgress: { select: { isCompleted: true } },
                        },
                    },
                },
            },
        },
        orderBy: { updatedAt: 'desc' },
    })

    return Promise.all(courses.map(async (course) => ({
        courseId: course.id,
        title: course.title,
        totalStudents: course.enrollments.length,
        activeStudents: course.enrollments.length,
        modules: course.modules,
        completionRate: await calculateCompletionRate(course.modules),
    })))
})

export async function calculateCompletionRate(modules: {
    chapters: {
        studentProgress: {
            isCompleted: boolean;
        }[];
    }[];
}[]): Promise<number> {
    let totalProgressRows = 0;
    let completedProgressRows = 0;

    modules.forEach((module) => {
        module.chapters.forEach((chapter) => {
            totalProgressRows += chapter.studentProgress.length;
            completedProgressRows += chapter.studentProgress.filter((progress) => progress.isCompleted).length;
        });
    });

    return totalProgressRows === 0 ? 0 : (completedProgressRows / totalProgressRows) * 100;
}
