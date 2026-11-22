import { requireAdminApi } from "@/lib/api-auth"
import { prisma } from "@/lib/db"
import { deleteFile } from "@/lib/s3"
import { NextResponse } from "next/server"

export async function DELETE(
    req: Request,
    props: { params: Promise<{ courseId: string, attachmentId: string }> }
) {
    const params = await props.params;
    try {

        const authz = await requireAdminApi()
        if (!authz.ok) return authz.response

        const course = await prisma.course.findUnique({
            where: { id: params.courseId },
            select: { id: true },
        })

        if (!course) {
            return new NextResponse("Not found", { status: 404 })
        }

        const attachment = await prisma.attachment.findUnique({
            where: {
                id: params.attachmentId,
                courseId: params.courseId,
            }
        })

        if(attachment && attachment.url){
            try {
                await deleteFile(attachment.url);
            } catch (error) {
                console.error("Error deleting file from S3:", error);
            }
        }

        const deletedAttachment = await prisma.attachment.delete({
            where: {
                courseId: params.courseId,
                id: params.attachmentId, 
            }
        })

        return NextResponse.json(deletedAttachment)

    } catch (error) {
        console.log("course_error_id_attachments: ", error)
        return new NextResponse("Internal Error: ", { status: 500 })
    }
}
