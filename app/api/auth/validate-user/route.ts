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
      include: {
        academicYears: true,
        payments: {
          where: {
            status: 'COMPLETED'
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ redirectTo: "/" });
    }

    if (user.role === UserRole.STUDENT) {
      
      const hasValidEnrollment = user.academicYears.some(year => year.isPaid === true);
      
      if (!hasValidEnrollment) {
        return NextResponse.json({ 
          redirectTo: "/checkout",
          userInfo: {
            email: user.email,
            name: user.name
          }
        });
      }
    }

    // For all roles, check if they have completed onboarding
    if (!user.onboardingCompleted) {
      return NextResponse.json({ redirectTo: "/onboarding" });
    }

    // If all validations pass, redirect based on role
    const roleRedirects = {
      [UserRole.STUDENT]: "/student",
      [UserRole.TEACHER]: "/teacher",
      [UserRole.ADMIN]: "/admin",
    };

    return NextResponse.json({ redirectTo: roleRedirects[user.role] || "/" });
  } catch (error) {
    console.error("Error validating user:", error);
    return NextResponse.json({ redirectTo: "/" });
  }
} 