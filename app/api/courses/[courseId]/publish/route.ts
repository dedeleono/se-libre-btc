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
            },
            include: {
                courseCategory: {
                    include: {
                        category: true
                    }
                },
                modules: {
                    include: {
                        chapters: {
                            include: {
                                attachments: true,
                            }
                        }
                    }
                }
            }
        });

        if (!course) return new NextResponse("Course Not Found", { status: 400 })

        const hasPublishedChapter = course.modules.some(module => 
            module.chapters.some(chapter => chapter.isPublished)
        );

        if (!course.title || !course.modules || !hasPublishedChapter) {
            return new NextResponse("Missing Required Fields", { status: 400 })
        }

        const publishedCourse = await prisma.course.update({
            where: {
                id: params.courseId
            },
            data: {
                isPublished: true
            }
        })

        return NextResponse.json(publishedCourse)

    } catch (error) {
        console.log("COURSE_ID_PUBLISH", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}