import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface ReorderRequest {
    questions: {
        id: string;
        position: number;
    }[];
}

export async function PUT(
    req: Request,
    { params }: { params: { assignmentId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { questions } = await req.json() as ReorderRequest;

        // Update all questions in a single transaction
        const updates = await prisma.$transaction(
            questions.map(({ id, position }) =>
                prisma.question.update({
                    where: {
                        id,
                        assignmentId: params.assignmentId
                    },
                    data: { position }
                })
            )
        );

        return NextResponse.json({
            success: true,
            updates
        });

    } catch (error) {
        console.error("[QUESTIONS_REORDER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}