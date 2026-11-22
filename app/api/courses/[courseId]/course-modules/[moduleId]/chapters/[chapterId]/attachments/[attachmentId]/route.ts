import { requireAdminApi } from "@/lib/api-auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { deleteFile } from '@/lib/s3';

export async function DELETE(
    req: Request,
    props: { params: Promise<{ courseId: string, chapterId:string, attachmentId: string }> }
) {
    const params = await props.params;
    try {

        const authz = await requireAdminApi()
        if (!authz.ok) return authz.response

        const attachment = await prisma.attachment.findUnique({
            where: {
                id: params.attachmentId,
                chapterId: params.chapterId,
            }
        })

        if (attachment && attachment.url){
            try {
                await deleteFile(attachment.url);
            } catch (error) {
                console.error("Error deleting file from S3:", error);
                // Decide if you want to stop the process here or continue with database deletion
            }
        }

        const deletedAttachment = await prisma.attachment.delete({
            where: {
                chapterId: params.chapterId,
                id: params.attachmentId,
            }
        })

        return NextResponse.json(deletedAttachment)

    } catch (error) {
        console.log("chapter_error_id_attachments: ", error)
        return new NextResponse("Internal Error: ", { status: 500 })
    }
}