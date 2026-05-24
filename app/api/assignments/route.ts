import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !["ADMIN", "TEACHER"].includes(session.user.role)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const values = await req.json();
        const { 
            title, 
            description, 
            isQuiz,
            maxPoints, // Default to 10 points
            isOnline,
            timer, 
            deadline, 
            chapterId 
        } = values;

        const assignment = await prisma.assignment.create({
            data: {
                title,
                description,
                isQuiz,
                isOnline,
                maxPoints,
                timer,
                deadline: deadline ? new Date(deadline) : null,
                chapterId,
                createdById: session.user.id,
            },
        });

        return NextResponse.json(assignment);
    } catch (error) {
        console.error("[ASSIGNMENTS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}