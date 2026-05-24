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

        const level = await prisma.level.findUnique({
            where: {
                id: params.levelId
            },
            include: {
                levelCourses: {
                    include: {
                        course: true
                    }
                },
                students: {
                    include: {
                        studentCourses: true
                    }
                }
            }
        });

        return NextResponse.json(level)
    } catch (error) {
        console.log("[LEVEL_DEBUG]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}