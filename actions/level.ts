"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getLevels(includeWithStudents: boolean = true) {
    try {
        const levels = await prisma.level.findMany({
            where: includeWithStudents ? {} : {
                students: {
                    none: {}
                }
            },
            include: {
                students: true,
                teacherLevels: {
                    include: {
                        teacher: true
                    }
                },
                levelCourses: {
                    include: {
                        course: true
                    }
                }
            }
        });
        return levels;
    } catch (error) {
        throw new Error("Failed to fetch levels");
    }
}

export async function createLevel(name: string) {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            throw new Error("Unauthorized")
        }

        // Get the count of existing levels to set the position
        const count = await prisma.level.count();

        const level = await prisma.level.create({
            data: { 
                name,
                position: count // This ensures new levels are added at the end
            }
        })

        revalidatePath("/admin/courses")
        return level
    } catch (error) {
        throw new Error("Failed to create level")
    }
}

export async function assignStudentToLevel(studentId: string, levelId: string) {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            throw new Error("Unauthorized")
        }

        return await prisma.$transaction(async (tx) => {
            console.log(`Assigning student ${studentId} to level ${levelId}`);

            // 1. Assign student to level
            const updatedStudent = await tx.user.update({
                where: { id: studentId },
                data: { levelId }
            });
            console.log('Updated student:', updatedStudent);

            // 2. Get all courses assigned to this level
            const levelCourses = await tx.levelCourse.findMany({
                where: { levelId },
                include: { course: true }
            });
            console.log('Found level courses:', levelCourses);

            if (levelCourses.length === 0) {
                console.log('No courses found for this level');
                return updatedStudent;
            }

            const studentCoursePromises = levelCourses.map((levelCourse) =>
                tx.studentCourse.upsert({
                    where: {
                        studentId_courseId: {
                            studentId: studentId,
                            courseId: levelCourse.courseId,
                        }
                    },
                    create: {
                        studentId: studentId,
                        courseId: levelCourse.courseId,
                        isAssignedByLevel: true
                    },
                    update: {
                        isAssignedByLevel: true
                    }
                })
            );
            const createdStudentCourses = await Promise.all(studentCoursePromises);
            console.log('Created student courses:', createdStudentCourses);

            revalidatePath("/admin/sp");
            return updatedStudent;
        });
    } catch (error) {
        throw new Error("Failed to assign student to level")
    }
}

export async function assignTeacherToLevel(teacherId: string, levelId: string) {
    try {
        const session = await auth()
        if (session?.user?.role !== "ADMIN") {
            throw new Error("Unauthorized")
        }

        const teacherLevel = await prisma.levelTeacher.create({
            data: {
                teacherId,
                levelId,
            },
            include: {
                teacher: true,
                level: true,
            }
        });

        revalidatePath("/admin/sp");
        return teacherLevel;
    } catch (error) {
        console.error("Error assigning teacher to level:", error);
        throw new Error("Failed to assign teacher to level");
    }
}

export async function deleteLevel(levelId: string) {
    try {
        const level = await prisma.level.findUnique({
            where: { id: levelId },
            include: { students: true }
        });

        if (!level) {
            throw new Error("Level not found");
        }

        if (level.students.length > 0) {
            throw new Error("Cannot delete level with students");
        }

        await prisma.level.delete({
            where: { id: levelId }
        });

        revalidatePath("/admin/courses");
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to delete level");
    }
}