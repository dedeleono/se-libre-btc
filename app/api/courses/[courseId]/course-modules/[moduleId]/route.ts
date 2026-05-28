import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { deleteFile } from "@/lib/s3"

export async function PATCH(
    req: Request,
    { params }: { params: { courseId: string, moduleId: string } }
) {
    try {

        const session = await auth()
        const values = await req.json()

        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

        const existingModule = await prisma.courseModule.findUnique({
            where: {
                id: params.moduleId,
            },
        });

        if (!existingModule) {
            return new NextResponse("Module not found", { status: 404 });
        }

        const courseModule = await prisma.courseModule.update({
            where: {
                id: params.moduleId,
            },
            data: {
                ...values
            }
        });

        return NextResponse.json(courseModule)

    } catch (error) {
        console.log("[COURSES_MODULE_ID]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { courseId: string; moduleId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch the module with all related data
        const courseModule = await prisma.courseModule.findUnique({
            where: { id: params.moduleId },
            include: {
                chapters: {
                    include: {
                        attachments: true,
                    }
                }
            }
        });

        if (!courseModule) {
            return new NextResponse("Module not found", { status: 404 });
        }

        // Collect all files to delete from S3
        const filesToDelete = courseModule.chapters.flatMap(chapter => [
            chapter.videoUrl,
            chapter.imageUrl,
            chapter.pdfUrl,
            ...chapter.attachments.map(attachment => attachment.url),
        ]).filter(Boolean) as string[];

        // Delete files from S3
        for (const fileUrl of filesToDelete) {
            try {
                await deleteFile(fileUrl);
            } catch (error) {
                console.error(`Error deleting file from S3: ${fileUrl}`, error);
            }
        }

        const deletedModule = await prisma.courseModule.delete({
            where: { id: params.moduleId },
        });

        return NextResponse.json(deletedModule);
    } catch (error) {
        console.error("[MODULE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}