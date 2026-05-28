import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { ChapterType } from "@prisma/client"

export async function POST(
    req: Request,
    { params }: { params: { moduleId: string } }
) {
    try {
        const session = await auth()
        const { title, type } = await req.json()

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const dbUser = await prisma.user.findUnique({
            where: {
                email: session.user.email as string,
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
