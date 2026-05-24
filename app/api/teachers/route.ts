import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
) {
    try {
        const session = await auth();
        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role");
        if (!session?.user || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const users = await prisma.user.findMany({
            where: {
                role: role as UserRole,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error("[USERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}