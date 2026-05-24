import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PATCH(
    req: Request,
    { params }: { params: { courseId: string, moduleId: string, chapterId: string } }
) {
    try {

        const session = await auth()
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

        const unpublishedChapter = await prisma.chapter.update({
            where: {
                id: params.chapterId,
                moduleId: params.moduleId,
            },
            data: {
                isPublished: false,
            },
        });

        return NextResponse.json(unpublishedChapter)

    } catch (error) {
        console.log("CHAPTER_PUBLISH", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}