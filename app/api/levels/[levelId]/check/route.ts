import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: { levelId: string } }
) {
    try {
        const level = await prisma.level.findUnique({
            where: {
                id: params.levelId,
            },
            include: {
                levelCourses: {
                    include: {
                        course: true,
                    },
                },
                students: {
                    include: {
                        studentCourses: {
                            include: {
                                course: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(level);
    } catch (error) {
        console.error("[LEVEL_CHECK]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}