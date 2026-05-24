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
            // Create the chapter first
            const chapter = await tx.chapter.create({
                data: {
                    title,
                    moduleId: params.moduleId,
                    position: newPosition,
                    type: type as ChapterType,
                },
            });

            // If type is QUIZ or ASSIGNMENT, create the corresponding Assignment record
            if ((type === "QUIZ" || type === "ASSIGNMENT")) {
                await tx.assignment.create({
                    data: {
                        title: `${title} ${type === "QUIZ" ? "Quiz" : "Assignment"}`,
                        maxPoints: 100,
                        isQuiz: type === "QUIZ",
                        isOnline: true,  // Add this since it's required and has a default
                        timer: 3600,
                        deadline: null,
                        creator: {
                            connect: {
                                id: dbUser.id
                            }
                        },
                        chapter: {
                            connect: {
                                id: chapter.id
                            }
                        }
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