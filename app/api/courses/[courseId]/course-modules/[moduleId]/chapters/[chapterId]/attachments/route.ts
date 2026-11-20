import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/api-auth"

export async function POST(
    req: Request,
    props: { params: Promise<{ courseId: string, chapterId: string }> }
) {
    const params = await props.params;
    try {

        const authz = await requireAdminApi()
        if (!authz.ok) return authz.response

        const { url } = await req.json()

        const attachment = await prisma.attachment.create({
            data: {
                url,
                name: url.split("/").pop(),
                chapterId: params.chapterId,
                uploaderId: authz.session.user.id
            }
        })

        return NextResponse.json(attachment)

    } catch (error) {
        console.log("course_error_id_attachments: ", error)
        return new NextResponse("Internal Error: ", { status: 500 })
    }
}