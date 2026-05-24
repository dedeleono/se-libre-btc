import { prisma } from "@/lib/db";

export async function validateAndAssignCoursesToStudent(studentId: string, levelId: string) {
    const levelCourses = await prisma.levelCourse.findMany({
        where: { levelId },
        include: { course: true }
    });

    if (levelCourses.length > 0) {
        await prisma.studentCourse.createMany({
            data: levelCourses.map(lc => ({
                studentId,
                courseId: lc.courseId,
                isAssignedByLevel: true
            })),
            skipDuplicates: true
        });
    }
}

export async function validateAndAssignStudentsToCourse(courseId: string, levelId: string) {
    const studentsInLevel = await prisma.user.findMany({
        where: {
            levelId,
            role: "STUDENT"
        }
    });

    if (studentsInLevel.length > 0) {
        await prisma.studentCourse.createMany({
            data: studentsInLevel.map(student => ({
                studentId: student.id,
                courseId,
                isAssignedByLevel: true
            })),
            skipDuplicates: true
        });
    }
}