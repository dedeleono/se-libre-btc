import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PATCH(
    req: Request,
    props: { params: Promise<{ courseId: string, moduleId: string, chapterId: string }> }
) {
    const params = await props.params;
    try {

        const session = await auth()
        if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

        const existingChapter = await prisma.chapter.findFirst({
            where: { id: params.chapterId, moduleId: params.moduleId },
        });

        if (!existingChapter) return new NextResponse("Not found", { status: 404 });

        const unpublishedChapter = await prisma.chapter.update({
            where: { id: params.chapterId },
            data: { isPublished: false },
        });

        return NextResponse.json(unpublishedChapter)

    } catch (error) {
        console.log("CHAPTER_PUBLISH", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}