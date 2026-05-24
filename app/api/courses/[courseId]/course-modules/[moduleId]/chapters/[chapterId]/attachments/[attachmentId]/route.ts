import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { deleteFile } from '@/lib/s3';

export async function DELETE(
    req: Request,
    { params }: { params: { courseId: string, chapterId:string, attachmentId: string } }
) {
    try {

        const session = await auth()
        if (!session?.user) {
            return new NextResponse("Unauthorized: ", { status: 401 })
        }

        // const courseOwner = await prisma.course.findUnique({
        //     where: {
        //         id: params.courseId,
        //         userId: session?.user?.id
        //     }
        // })

        // if (!courseOwner) {
        //     return new NextResponse("Unauthorized: ", { status: 401 })
        // }

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