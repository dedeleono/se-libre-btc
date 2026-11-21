import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/api-auth"

export async function POST(req: Request, props: { params: Promise<{ courseId: string }> }) {
    const params = await props.params;
    try {

        const authz = await requireAdminApi()
        if (!authz.ok) return authz.response

        const { url } = await req.json()

        const course = await prisma.course.findUnique({
            where: { id: params.courseId },
            select: { id: true },
        })

        if (!course) {
            return new NextResponse("Not found", { status: 404 })
        }

        const attachment = await prisma.attachment.create({
            data: {
                url,
                name: url.split("/").pop(),
                courseId: params.courseId,
                uploaderId: authz.session.user.id
            }
        })

        return NextResponse.json(attachment)

    } catch (error) {
        console.log("course_error_id_attachments: ", error)
        return new NextResponse("Internal Error: ", { status: 500 })
    }
}
