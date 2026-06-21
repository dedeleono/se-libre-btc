import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { deleteFile } from '@/lib/s3';
import { ChapterType } from "@prisma/client";
import * as z from "zod";

const updateChapterSchema = z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().nullable().optional(),
    type: z.nativeEnum(ChapterType).optional(),
    isIntro: z.boolean().optional(),
    hasWalletSimulator: z.boolean().optional(),
    startTime: z.string().datetime().nullable().optional(),
    endTime: z.string().datetime().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    videoUrl: z.string().nullable().optional(),
    youtubeUrl: z.string().nullable().optional(),
    pdfUrl: z.string().nullable().optional(),
    richContent: z.string().nullable().optional(),
})

export async function GET(
    req: Request,
    { params }: { params: { courseId: string; moduleId: string; chapterId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 });

        const chapter = await prisma.chapter.findFirst({
            where: {
                id: params.chapterId,
                moduleId: params.moduleId,
            },
            include: {
                quiz: {
                    include: {
                        questions: {
                            include: { options: true },
                            orderBy: { position: "asc" },
                        }
                    }
                },
                liveSession: true,
            }
        });

        if (!chapter) {
            return new NextResponse("Not found", { status: 404 });
        }

        return NextResponse.json(chapter);

    } catch (error) {
        console.log("[CHAPTER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { courseId: string, moduleId: string, chapterId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
        if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 });

        const chapter = await prisma.chapter.findFirst({
            where: {
                id: params.chapterId,
                moduleId: params.moduleId,
            },
        });

        if (!chapter) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Delete files from S3 if they exist
        const filesToDelete = [
            chapter.videoUrl,
            chapter.pdfUrl,
            chapter.imageUrl
        ].filter(Boolean);

        for (const fileUrl of filesToDelete) {
            try {
                await deleteFile(fileUrl as string);
            } catch (error) {
                console.error("Error deleting file from S3:", error);
            }
        }

        const deletedChapter = await prisma.chapter.delete({
            where: { id: params.chapterId }
        });

        return NextResponse.json(deletedChapter);
        
    } catch (error) {
        console.log("CHAPTER_ID_DELETE", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { courseId: string, moduleId: string, chapterId: string } }
) {
    try {
        const session = await auth()
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })
        if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

        const { isIntro, hasWalletSimulator, ...values } = updateChapterSchema.parse(await req.json())

        const existingChapter = await prisma.chapter.findUnique({
            where: {
                id: params.chapterId,
            },
        });

        if (!existingChapter) {
            return new NextResponse("Chapter not found", { status: 404 });
        }

        // if(values.videoUrl && values.videoUrl !== existingChapter.videoUrl){
        //     try {
        //         await deleteFile(existingChapter.videoUrl as string);
        //     } catch (error) {
        //         console.error("Error deleting file from S3:", error);
        //     }


        // }

        if (values.videoUrl && values.videoUrl !== existingChapter.videoUrl) {
            // Delete old video if it exists
            if (existingChapter.videoUrl) {
                try {
                    await deleteFile(existingChapter.videoUrl);
                } catch (error) {
                    console.error("Error deleting old video from S3:", error);
                }
            }

            // Delete any existing PDF since we can't have both
            if (existingChapter.pdfUrl) {
                try {
                    await deleteFile(existingChapter.pdfUrl);
                } catch (error) {
                    console.error("Error deleting PDF from S3:", error);
                }
            }
            values.pdfUrl = null;
        }

        // Handle PDF changes
        if (values.pdfUrl && values.pdfUrl !== existingChapter.pdfUrl) {
            // Delete old PDF if it exists
            if (existingChapter.pdfUrl) {
                try {
                    await deleteFile(existingChapter.pdfUrl);
                } catch (error) {
                    console.error("Error deleting old PDF from S3:", error);
                }
            }

            // Delete any existing video since we can't have both
            if (existingChapter.videoUrl) {
                try {
                    await deleteFile(existingChapter.videoUrl);
                } catch (error) {
                    console.error("Error deleting video from S3:", error);
                }
            }
            values.videoUrl = null; // Clear video URL from database
        }

        if (values.imageUrl && values.imageUrl !== existingChapter.imageUrl) {
            // Delete the old image from S3
            if (existingChapter.imageUrl) {
                try {
                    await deleteFile(existingChapter.imageUrl);
                } catch (error) {
                    console.error("Error deleting old image from S3:", error);
                }
            }
        }
        

        const chapter = await prisma.chapter.update({
            where: {
                id: params.chapterId,
            },
            data: {
                isIntro,
                hasWalletSimulator,
                ...values,
                startTime: values.startTime ? new Date(values.startTime) : values.startTime,
                endTime: values.endTime ? new Date(values.endTime) : values.endTime,
            }
        });

        return NextResponse.json(chapter)

    } catch (error) {
        console.log("[COURSES_CHAPTER_ID]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
