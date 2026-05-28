import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
    matcher: [
        '/student/:path*',
        '/admin/:path*',
        '/((?!_next/static|_next/image|api|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp)).*)',
    ]
}