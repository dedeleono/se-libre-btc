import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/about",
  "/checkout",
  "/checkout/error",
  "/checkout/success",
  "/contact",
  "/courses",
  "/learning-paths",
  "/onboarding",
  "/sign-in",
  "/verify-request",
];

function isPublicRoute(pathname: string) {
  return (
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/learning-paths/") ||
    pathname.startsWith("/courses/preview/")
  );
}

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const sessionCookie = getSessionCookie(request);
  const isAuthPage = nextUrl.pathname === "/sign-in" || nextUrl.pathname === "/verify-request";

  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL("/api/auth/post-login", nextUrl));
  }

  if (!sessionCookie && !isPublicRoute(nextUrl.pathname)) {
    const callbackUrl = `${nextUrl.pathname}${nextUrl.search}`;
    const signInUrl = new URL("/sign-in", nextUrl);
    signInUrl.searchParams.set("callbackUrl", callbackUrl);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/admin/:path*",
    "/((?!_next/static|_next/image|api|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp)).*)",
  ],
};
