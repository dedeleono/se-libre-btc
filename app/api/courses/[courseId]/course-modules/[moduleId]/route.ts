import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { deleteFile } from "@/lib/s3"
import * as z from "zod"

const updateModuleSchema = z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().nullable().optional(),
})

export async function PATCH(
    req: Request,
    props: { params: Promise<{ courseId: string, moduleId: string }> }
) {
    const params = await props.params;
    try {

        const session = await auth()

        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })
        if (session.user.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 })

        const values = updateModuleSchema.parse(await req.json())

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
    props: { params: Promise<{ courseId: string; moduleId: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        if (session.user.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
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
