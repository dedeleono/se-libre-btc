import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assignmentPatchSchema } from "@/types/assignments";

export async function PATCH(
    req: Request,
    { params }: { params: { assignmentId: string } }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const validatedData = assignmentPatchSchema.parse(body);

        const updatedAssignment = await prisma.assignment.update({
            where: {
                id: params.assignmentId,
            },
            data: validatedData,
        });

        return NextResponse.json(updatedAssignment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.error("[ASSIGNMENT_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}