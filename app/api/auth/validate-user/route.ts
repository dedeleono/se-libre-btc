import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ redirectTo: "/" });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ redirectTo: "/" });
    }

    if (user.isDeleted || user.isBanned) {
      return NextResponse.json({ redirectTo: "/" });
    }

    if (!user.onboardingCompleted) {
      return NextResponse.json({ redirectTo: "/onboarding" });
    }

    const roleRedirects = {
      [UserRole.STUDENT]: "/student",
      [UserRole.ADMIN]: "/admin",
    };

    return NextResponse.json({ redirectTo: roleRedirects[user.role] || "/" });
  } catch (error) {
    console.error("Error validating user:", error);
    return NextResponse.json({ redirectTo: "/" });
  }
} 
