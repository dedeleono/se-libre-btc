import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PATCH(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {

        const session = await auth()
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

        const course = await prisma.course.findUnique({
            where: {
                id: params.courseId,
                // userId: session.user.id
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