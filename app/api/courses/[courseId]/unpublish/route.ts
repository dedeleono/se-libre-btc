import { requireAdminApi } from "@/lib/api-auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, props: { params: Promise<{ courseId: string }> }) {
    const params = await props.params;
    try {
        const authz = await requireAdminApi()
        if (!authz.ok) return authz.response

        const course = await prisma.course.findUnique({
            where: {
                id: params.courseId,
            }
        });

        if (!course) return new NextResponse("Course Not Found", { status: 400 })

        const unPublishedCourse = await prisma.course.update({
            where: {
                id: params.courseId
            },
            data: {
                isPublished: false
            }
        })

        return NextResponse.json(unPublishedCourse)

    } catch (error) {
        console.log("COURSE_ID_UNPUBLISH", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}