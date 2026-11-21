import { validateChapterForPublishing } from "@/lib/validations/chapter";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

export async function PATCH(
    req: Request,
    props: { params: Promise<{ courseId: string; moduleId: string; chapterId: string }> }
) {
    const params = await props.params;
    try {
        const authz = await requireAdminApi();
        if (!authz.ok) return authz.response;

        const chapter = await prisma.chapter.findFirst({
            where: {
                id: params.chapterId,
                moduleId: params.moduleId,
            },
            include: {
                quiz: {
                    include: {
                        questions: {
                            include: { options: true },
                        },
                    },
                },
            }
        });

        if (!chapter) {
            return new NextResponse("Not found", { status: 404 });
        }

        const validation = validateChapterForPublishing(chapter);

        if (!validation.isValid) {
            return new NextResponse(validation.message, { status: 400 });
        }

        const publishedChapter = await prisma.chapter.update({
            where: {
                id: params.chapterId,
            },
            data: {
                isPublished: true,
            },
        });

        return NextResponse.json({
            ...publishedChapter,
            message: "Chapter published successfully"
        });

    } catch (error) {
        console.log("CHAPTER_PUBLISH", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}