import { NextResponse } from "next/server";

import { getRoleRedirect, getSafeCallbackUrl, getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession({ allowInactive: true });

  if (!session?.user || session.user.isDeleted || session.user.isBanned) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const latestUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      onboardingCompleted: true,
      isDeleted: true,
      isBanned: true,
    },
  });

  if (!latestUser || latestUser.isDeleted || latestUser.isBanned) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const requestUrl = new URL(request.url);
  const safeNext = getSafeCallbackUrl(
    requestUrl.searchParams.get("next"),
    requestUrl.origin
  );
  const redirectPath = latestUser.onboardingCompleted
    ? safeNext ?? getRoleRedirect(latestUser)
    : "/onboarding";
  const url = new URL(redirectPath, request.url);

  return NextResponse.redirect(url);
}
