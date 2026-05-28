import { prisma } from "@/lib/db";

export const getProgress = async (userId: string, courseId: string): Promise<number> => {
    try {
        const publishedChapters = await prisma.chapter.findMany({
            where: {
                module: {
                    courseId: courseId
                },
                isPublished: true,
            },
            select: {
                id: true,
            }
        })

        const publishedChapterIds = publishedChapters.map(chapter => chapter.id);

        const validCompletedChapters = await prisma.chapterProgress.count({
            where: {
                userId: userId,
                chapterId: {
                    in: publishedChapterIds
                },
                isCompleted: true
            }
        });

        if (publishedChapters.length === 0) {
            return 0;
        }

        return (validCompletedChapters / publishedChapters.length) * 100;
        
    } catch (error) {
        console.log("[GET_PROGRESS]", error);
        return 0;
    }
}