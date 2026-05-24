import { prisma } from "@/lib/db";

export async function assignCourseToLevel(courseId: string, levelId: string) {
    try {
        return await prisma.$transaction(async (tx) => {
            console.log(`Assigning course ${courseId} to level ${levelId}`);

            // 1. Create the level-course association
            const levelCourse = await tx.levelCourse.create({
                data: {
                    courseId,
                    levelId,
                },
            });
            console.log('Created level course:', levelCourse);

            // 2. Get all students in this level
            const studentsInLevel = await tx.user.findMany({
                where: {
                    levelId: levelId,
                    role: "STUDENT",
                },
            });
            console.log(`Found ${studentsInLevel.length} students in level`);

            // 3. Create StudentCourse entries for all students in the level
            const studentCoursePromises = studentsInLevel.map((student) =>
                tx.studentCourse.upsert({
                    where: {
                        studentId_courseId: {
                            studentId: student.id,
                            courseId: courseId,
                        },
                    },
                    create: {
                        studentId: student.id,
                        courseId: courseId,
                        isAssignedByLevel: true,
                    },
                    update: {
                        isAssignedByLevel: true,
                    },
                })
            );

            const createdStudentCourses = await Promise.all(studentCoursePromises);
            console.log('Created/Updated student courses:', createdStudentCourses);

            return {
                levelCourse,
                studentCourses: createdStudentCourses,
            };
        });
    } catch (error) {
        console.error("Error in assignCourseToLevel:", error);
        throw new Error("Failed to assign course to level");
    }
}

export async function createCourse(data: any, levelId?: string) {
    try {
        const course = await prisma.course.create({
            data: {
                ...data,
                levelCourses: levelId ? {
                    create: {
                        levelId: levelId
                    }
                } : undefined
            },
            include: {
                levelCourses: true
            }
        });

        if (levelId) {
            // Get all students in this level
            const studentsInLevel = await prisma.user.findMany({
                where: {
                    levelId: levelId,
                    role: "STUDENT",
                },
            });

            if (studentsInLevel.length > 0) {
                await prisma.studentCourse.createMany({
                    data: studentsInLevel.map(student => ({
                        studentId: student.id,
                        courseId: course.id,
                        isAssignedByLevel: true
                    })),
                    skipDuplicates: true
                });
            }
        }

        return course;
    } catch (error) {
        console.error("Error in createCourse:", error);
        throw new Error("Failed to create course");
    }
}