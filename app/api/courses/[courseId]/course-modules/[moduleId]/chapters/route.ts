import { requireAdminApi } from "@/lib/api-auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { ChapterType } from "@prisma/client"
import * as z from "zod"

const createChapterSchema = z.object({
    title: z.string().trim().min(1),
    type: z.nativeEnum(ChapterType).default(ChapterType.LESSON),
})

export async function POST(req: Request, props: { params: Promise<{ moduleId: string }> }) {
    const params = await props.params;
    try {
        const authz = await requireAdminApi()
        if (!authz.ok) return authz.response

        const { title, type } = createChapterSchema.parse(await req.json())

        const dbUser = await prisma.user.findUnique({
            where: {
                email: authz.session.user.email as string,
            },
        });

        if (!dbUser) {
            return new NextResponse("User not found", { status: 404 })
        }

        const lastChapter = await prisma.chapter.findFirst({
            where: {
                moduleId: params.moduleId
            },
            orderBy: {
                position: "desc"
            }
        })

        const newPosition = lastChapter ? lastChapter.position + 1 : 1;

        const moduleChapter = await prisma.$transaction(async (tx) => {
            const chapter = await tx.chapter.create({
                data: {
                    title,
                    moduleId: params.moduleId,
                    position: newPosition,
                    type: type as ChapterType,
                },
            });

            if (type === "QUIZ") {
                await tx.quiz.create({
                    data: {
                        title,
                        chapterId: chapter.id,
                    }
                });
            }

            return chapter;
        });

        return NextResponse.json(moduleChapter)

    } catch (error) {
        console.log("[CHAPTERS]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
