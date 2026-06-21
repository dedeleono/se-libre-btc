import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { deleteFile } from "@/lib/s3"
import { NextResponse } from "next/server"

export async function DELETE(
    req: Request,
    props: { params: Promise<{ courseId: string, attachmentId: string }> }
) {
    const params = await props.params;
    try {

        const session = await auth()
        if (!session?.user) {
            return new NextResponse("Unauthorized: ", { status: 401 })
        }

        const dbUser = await prisma.user.findUnique({
            where: {
                id: session.user.id,
            }
        })

        if (!dbUser) {
            return new NextResponse("Unauthorized: ", { status: 401 })
        }

        const courseOwner = await prisma.course.findFirst({
            where: {
                id: params.courseId,
                OR: [
                    { contributors: { some: { userId: dbUser.id } } },
                    ...(dbUser.role === "ADMIN" ? [{}] : []),
                ],
            }
        })

        if (!courseOwner) {
            return new NextResponse("Unauthorized: ", { status: 401 })
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
