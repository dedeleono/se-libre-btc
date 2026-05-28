import { prisma } from "@/lib/db";

export const getChapters = async ({
    userId,
    chapterId
}: {
    userId: string;
    courseId: string;
    chapterId: string;
}) => {
    try {
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: {
                quiz: {
                    include: {
                        questions: {
                            include: { options: true },
                            orderBy: { position: "asc" },
                        },
                    },
                },
                liveSession: true,
            },
        });

        if (!chapter) {
            throw new Error("Chapter not found");
        }

        const module = await prisma.courseModule.findFirst({
            where: { chapters: { some: { id: chapterId } } },
            include: {
                course: true,
                chapters: {
                    include: { quiz: true, liveSession: true },
                    orderBy: { position: "asc" },
                },
            },
        });

        if (!module) {
            throw new Error("Course not found");
        }

        const nextChapter = module.chapters.find((ch) => ch.position > chapter.position);
        const studentProgress = await prisma.chapterProgress.findUnique({
            where: { userId_chapterId: { userId, chapterId } },
        });

        return {
            chapter,
            course: module.course,
            nextChapter,
            studentProgress,
        };
    } catch (error) {
        console.error("[GET_CHAPTERS]", error);
        throw new Error("Internal Error");
    }
};