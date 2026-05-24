import { prisma } from "@/lib/db";

interface GetChaptersProps {
    userId: string;
    courseId: string;
    chapterId: string;
}

export const getChapters = async ({
    userId,
    courseId,
    chapterId
}: {
    userId: string;
    courseId: string;
    chapterId: string;
}) => {
    try {
        const chapter = await prisma.chapter.findUnique({
            where: {
                id: chapterId,
            },
            include: {
                assignments: {
                    include: {
                        questions: {
                            include: {
                                options: true
                            }
                        }
                    }
                }
            }
        });

        if (!chapter) {
            throw new Error("Chapter not found");
        }

        const course = await prisma.courseModule.findFirst({
            where: {
                chapters: {
                    some: {
                        id: chapterId
                    }
                }
            },
            include: {
                course: true,
                chapters: {
                    include: {
                        assignments: true
                    },
                    orderBy: {
                        position: "asc"
                    }
                }
            }
        });

        if (!course) {
            throw new Error("Course not found");
        }

        const nextChapter = course.chapters.find(
            (ch) => ch.position > chapter.position
        );

        const studentProgress = await prisma.chapterProgress.findUnique({
            where: {
                userId_chapterId: {
                    userId,
                    chapterId,
                },
            },
        });

        return {
            chapter,
            course: course.course,
            nextChapter,
            studentProgress,
        };
    } catch (error) {
        console.error("[GET_CHAPTERS]", error);
        throw new Error("Internal Error");
    }
};