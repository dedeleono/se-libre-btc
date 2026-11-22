import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorPath } from "@/lib/error-codes";
import { decideInvitationRedemption } from "@/lib/invitation-redemption";
import { createUserSignupNotification } from "@/lib/notifications";


export const dynamic = 'force-dynamic';

function getBaseUrl() {
    return process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

function redirectToSignIn(targetPath: string) {
    const signInUrl = new URL('/sign-in', getBaseUrl());
    signInUrl.searchParams.set('callbackUrl', targetPath);
    return NextResponse.redirect(signInUrl);
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const token = url.searchParams.get("token");

        if (!token) {
            return NextResponse.redirect(`${getBaseUrl()}${errorPath("invitationInvalid")}`);
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
            return NextResponse.redirect(`${getBaseUrl()}${errorPath("invitationInvalid")}`);
        }

        const redemption = decideInvitationRedemption(invitation, new Date());
        if (!redemption.ok) {
            await prisma.pendingInvitation.deleteMany({
                where: { id: invitation.id }
            });
            if (redemption.reason === "not_student") {
                console.warn("[VERIFY_INVITATION] rejected non-student invitation", { invitationId: invitation.id, role: invitation.role });
                return NextResponse.redirect(`${getBaseUrl()}${errorPath("invitationInvalid")}`);
            }
            return NextResponse.redirect(`${getBaseUrl()}${errorPath("invitationExpired")}`);
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: invitation.email },
        });

        const user = existingUser ?? await prisma.user.create({
            data: {
                email: invitation.email,
                name: invitation.name,
                firstName: invitation.firstName,
                lastName: invitation.lastName,
                role: "STUDENT",
                emailVerified: true,
                onboardingCompleted: false,
            },
        });

        // Create signup notification for admin users
        try {
            if (!existingUser) {
                await createUserSignupNotification(
                    user.id,
                    user.role,
                    user.name || user.email
                );
            }
        } catch (error) {
            console.error('Failed to create signup notification:', error);
        }

        if (user.role === "STUDENT" && (invitation.courseId || invitation.learningPathId || invitation.cohortId)) {
            const queryParams = new URLSearchParams({
                invitationId: invitation.id,
            });
            return redirectToSignIn(`/onboarding?${queryParams.toString()}`);
        }

        return redirectToSignIn('/onboarding');

    } catch (error) {
        console.error("[VERIFY_INVITATION]", error);
        return NextResponse.redirect(`${getBaseUrl()}${errorPath("invitationFailed")}`);
    }
} 
