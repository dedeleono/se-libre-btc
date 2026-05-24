import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: { teacherId: string } }
) {
    try {
        const { levelId } = await req.json();

        const updatedTeacher = await prisma.levelTeacher.create({
            data: {
                teacherId: params.teacherId,
                levelId: levelId,
            },
        });

        return NextResponse.json(updatedTeacher);
    } catch (error) {
        console.error("[TEACHER_LEVEL_ASSIGNMENT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { teacherId: string } }
) {
    try {
        const { levelId } = await req.json();

        await prisma.levelTeacher.deleteMany({
            where: {
                AND: [
                    { teacherId: params.teacherId },
                    { levelId: levelId }
                ]
            }
        });

        return NextResponse.json({ message: "Teacher unassigned successfully" });
    } catch (error) {
        console.error("[TEACHER_LEVEL_UNASSIGNMENT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}