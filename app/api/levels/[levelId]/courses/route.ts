import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(
    req: Request,
    { params }: { params: { levelId: string } }
) {
    try {
        const session = await auth()

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Get all published courses
        const availableCourses = await prisma.course.findMany({
            where: {
                AND: [
                    { isPublished: true },
                    {
                        NOT: {
                            levelCourses: {
                                some: {
                                    levelId: params.levelId
                                }
                            }
                        }
                    }
                ]
            },
            select: {
                id: true,
                title: true,
                description: true
            }
        });
        return NextResponse.json(availableCourses)
    } catch (error) {
        console.log("[COURSES]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}