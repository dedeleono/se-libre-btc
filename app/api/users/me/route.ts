import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { parseProfileUpdate } from "@/lib/validations/profile";

export async function PATCH(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json().catch(() => null);
        const parsed = parseProfileUpdate(body);

        if (!parsed.ok) {
            return NextResponse.json(
                { error: "INVALID_PROFILE", fieldErrors: parsed.fieldErrors },
                { status: 400 },
            );
        }

        const user = await prisma.user.update({
            where: {
                email: session.user.email,
            },
            data: parsed.data,
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[USERS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
