import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/validations/invitation-email";
import { createInvitationToken } from "@/lib/utils";
import { UserRole } from "@prisma/client";

interface CreateUserRequest {
    email: string;
    name: string;
    lastName: string;
    role: UserRole;
    phone?: string;
    levelId?: string;
}

export async function POST(req: Request) {
    if (!prisma) {
        console.error("[USERS_POST] Prisma client not initialized");
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }

    try {
        const body = await req.json() as CreateUserRequest;
        const { email, name, lastName, role, phone, levelId } = body;

        if (!email || !name || !lastName || !role) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Require levelId for students
        if (role === UserRole.STUDENT && !levelId) {
            return NextResponse.json(
                { error: "Level ID is required for student invitations" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        const existingInvitation = await prisma.pendingInvitation.findUnique({
            where: { email }
        });

        if (existingUser || existingInvitation) {
            return NextResponse.json(
                { error: "An invitation or account already exists for this email" },
                { status: 400 }
            );
        }

        const token = await createInvitationToken();

        // Create the pending invitation with basic information
        const invitation = await prisma.pendingInvitation.create({
            data: {
                email,
                name: `${name} ${lastName}`,
                firstName: name,
                lastName,
                role,
                phone,
                token,
                expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                metadata: {
                    levelId: role === UserRole.STUDENT ? levelId : undefined
                }
            },
        });

        const inviteUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-invitation?token=${token}`;
        await sendInvitationEmail(email, inviteUrl);

        return NextResponse.json({
            invitation,
            requiresPayment: role === UserRole.STUDENT
        }, { status: 200 });
    } catch (error) {
        console.error("[USERS_POST] Full error:", error);
        return NextResponse.json(
            { error: "Failed to create invitation" },
            { status: 500 }
        );
    }
}