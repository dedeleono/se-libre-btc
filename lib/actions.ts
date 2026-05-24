'use server'

import { cookies } from 'next/headers'
import { cache } from 'react'
import { prisma } from '@/lib/db'
import { CourseActivityData, CourseData } from "@/types/course-progress"
import { auth } from "@/lib/auth";

export async function getAuthToken() {
    const cookieStore = cookies()
    return cookieStore.get('dashboard-auth')?.value
}

export const getCachedDashboardData = cache(async (teacherId: string) => {
    try {
        
        const result = await prisma.$transaction(async (tx) => {
            const data = await tx.$queryRaw<Array<{
                totalStudents: bigint;
                activeCourses: bigint;
                pendingReviews: bigint;
            }>>`
              WITH TeacherCourses AS (
                SELECT DISTINCT c.id
                FROM "Course" c
                LEFT JOIN "LevelCourse" lc ON c."id" = lc."courseId"
                LEFT JOIN "LevelTeacher" tl ON lc."levelId" = tl."levelId"
                WHERE c."teacherId" = ${teacherId}
                OR tl."teacherId" = ${teacherId}
              )
              SELECT
                COALESCE((
                  SELECT COUNT(DISTINCT u.id)
                  FROM "User" u
                  LEFT JOIN "StudentCourse" sc ON u.id = sc."studentId"
                  LEFT JOIN TeacherCourses tc ON sc."courseId" = tc.id
                  JOIN "LevelTeacher" tl ON u."levelId" = tl."levelId"
                  WHERE u.role = 'STUDENT'
                  AND (tc.id IS NOT NULL OR tl."teacherId" = ${teacherId})
                ), 0) as "totalStudents",
                
                COALESCE((SELECT COUNT(*) FROM TeacherCourses), 0) as "activeCourses",
                
                COALESCE((
                  SELECT COUNT(*)
                  FROM "Submission" s
                  JOIN "Assignment" a ON s."assignmentId" = a.id
                  JOIN "Chapter" ch ON a."chapterId" = ch.id
                  JOIN "CourseModule" m ON ch."moduleId" = m.id
                  JOIN TeacherCourses tc ON m."courseId" = tc.id
                  WHERE s.status = 'SUBMITTED'
                  AND s.score IS NULL
                ), 0) as "pendingReviews"
            `;
            
            
            
            const returnData = {
                totalStudents: Number(data[0]?.totalStudents || 0),
                activeCourses: Number(data[0]?.activeCourses || 0),
                pendingReviews: Number(data[0]?.pendingReviews || 0)
            };
            
            
            return returnData;
        }, {
            isolationLevel: 'ReadCommitted'
        });

        return result;
    } catch (error) {
        console.error("Error in getCachedDashboardData:", error);
        return {
            totalStudents: 0,
            activeCourses: 0,
            pendingReviews: 0
        };
    }
});

export const getCachedCoursesActivity = cache(async (teacherId: string): Promise<CourseData[]> => {
    const courses = await prisma.course.findMany({
        where: {
            OR: [
                { teacherId },
                {
                    levelCourses: {
                        some: {
                            level: {
                                teacherLevels: {
                                    some: { teacherId }
                                }
                            }
                        }
                    }
                }
            ]
        },
        select: {
            id: true,
            title: true,
            levelCourses: {
                select: {
                    level: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            studentCourses: {
                select: {
                    student: {
                        select: {
                            id: true
                        }
                    }
                }
            },
            modules: {
                select: {
                    id: true,
                    title: true,
                    chapters: {
                        select: {
                            id: true,
                            studentProgress: {
                                select: {
                                    isCompleted: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const processedCourses = await Promise.all(courses.map(async course => ({
        courseId: course.id,
        title: course.title,
        level: course.levelCourses[0]?.level,
        totalStudents: course.studentCourses.length,
        activeStudents: course.studentCourses.length,
        modules: course.modules,
        completionRate: await calculateCompletionRate(course.modules)
    })));

    return processedCourses;
});

export async function calculateCompletionRate(modules: {
    chapters: {
        studentProgress: {
            isCompleted: boolean;
        }[];
    }[];
}[]): Promise<number> {
    let totalChapters = 0;
    let completedChapters = 0;

    modules.forEach(module => {
        module.chapters.forEach(chapter => {
            totalChapters += chapter.studentProgress.length;
            completedChapters += chapter.studentProgress.filter(p => p.isCompleted).length;
        });
    });

    return totalChapters === 0 ? 0 : (completedChapters / totalChapters) * 100;
}

export async function generateCarnet() {
    const year = new Date().getFullYear();
    
    const lastUser = await prisma.user.findFirst({
        where: {
            carnet: {
                startsWith: `${year}-`
            }
        },
        orderBy: {
            carnet: 'desc'
        },
        select: {
            carnet: true
        }
    });

    let nextNumber = 1;
    if (lastUser?.carnet) {
        const match = lastUser.carnet.match(/-(\d+)$/);
        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }

    const carnet = `${year}-${String(nextNumber).padStart(3, '0')}`;
    return carnet;
}

export async function addMineducId(studentId: string, mineducId: string) {

    const activeUser = await auth();
    if (!activeUser?.user) {
        return;
    }

    if (activeUser.user.role !== "ADMIN") {
        return;
    }

    const student = await prisma.user.update({
        where: {
            id: studentId
        },
        data: {
            mineducId
        }
    });

    return student;
}