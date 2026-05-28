import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { createDashboardJwt } from "@/lib/utils";
import { SupabaseNotifications } from "@/lib/supabase/notifications";


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
                course: true,
                learningPath: true,
                cohort: true,
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

        const sessionToken = await createDashboardJwt(user.id, user.email, user.role);
        cookies().set('next-auth.session-token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        if (user.role === "STUDENT" && (invitation.courseId || invitation.learningPathId || invitation.cohortId)) {
            const queryParams = new URLSearchParams({
                userId: user.id,
                email: invitation.email,
                name: invitation.name,
                invitationId: invitation.id,
                token,
            });

            if (invitation.courseId) queryParams.set("courseId", invitation.courseId);
            if (invitation.learningPathId) queryParams.set("learningPathId", invitation.learningPathId);
            if (invitation.cohortId) queryParams.set("cohortId", invitation.cohortId);

            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/checkout?${queryParams.toString()}`);
        }

        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/onboarding`);

    } catch (error) {
        console.error("[VERIFY_INVITATION]", error);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/error?message=Failed to verify invitation`);
    }
} 