import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { cookies } from "next/headers";
import { createDashboardJwt } from "@/lib/utils";
import { SupabaseNotifications } from "@/lib/supabase/notifications";
import { UserRole } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const token = url.searchParams.get("token");

        if (!token) {
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/error?message=Invalid invitation link`);
        }

        const invitation = await prisma.pendingInvitation.findUnique({
            where: { token },
            include: {
                level: true
            }
        });

        if (!invitation) {
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/error?message=Invalid invitation link`);
        }

        if (invitation.expires < new Date()) {
            await prisma.pendingInvitation.delete({
                where: { id: invitation.id }
            });
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/error?message=Invitation has expired`);
        }

        // Create the user
        const user = await prisma.user.create({
            data: {
                email: invitation.email,
                name: invitation.name,
                firstName: invitation.firstName,
                lastName: invitation.lastName,
                role: invitation.role,
                phone: invitation.phone,
                emailVerified: new Date(), // Mark email as verified since it's an invitation
                onboardingCompleted: false,
            },
        });

        // Create signup notification for admin users
        try {
            await SupabaseNotifications.createUserSignupNotification(
                user.id,
                user.role,
                user.name || user.email
            );
        } catch (error) {
            console.error('Failed to create signup notification:', error);
        }

        // Handle different roles
        if (user.role === UserRole.STUDENT) {
            // For students, always redirect to checkout with their level
            if (invitation.metadata && (invitation.metadata as any).levelId) {
                // Create a query string with all necessary parameters
                const queryParams = new URLSearchParams({
                    userId: user.id,
                    levelId: (invitation.metadata as any).levelId,
                    email: invitation.email,
                    name: invitation.name,
                    invitationId: invitation.id,
                    token: token // Include the token for verification
                }).toString();

                return NextResponse.redirect(
                    `${process.env.NEXTAUTH_URL}/checkout?${queryParams}`
                );
            } else {
                // If no level was specified, redirect to error
                return NextResponse.redirect(
                    `${process.env.NEXTAUTH_URL}/error?message=No level specified for student invitation`
                );
            }
        } else {
            // For teachers and admins, redirect to onboarding directly
            const sessionToken = await createDashboardJwt(user.id, user.email, user.role);
            cookies().set('next-auth.session-token', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/onboarding`);
        }

    } catch (error) {
        console.error("[VERIFY_INVITATION]", error);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/error?message=Failed to verify invitation`);
    }
} 