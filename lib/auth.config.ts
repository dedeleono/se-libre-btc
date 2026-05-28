import { NextAuthConfig } from "next-auth";
import { NextURL } from "next/dist/server/web/next-url";
import Google from "next-auth/providers/google";
import { UserRole } from "@prisma/client";

type AuthorizedCallback = {
    auth: {
        user?: {
            id?: string | null;
            name?: string | null;
            email?: string | null;
            role?: UserRole | null;
        } | null;
    } | null;
    request: {
        nextUrl: NextURL;
    };
};

export const authConfig: NextAuthConfig = {
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
    ],
    pages: {
        signIn: "/sign-in",
        signOut: "/sign-in",
        verifyRequest: "/verify-request",
    },
    callbacks: {
        async redirect({ url, baseUrl }) {
            // Handle onboarding and checkout routes
            if (url.startsWith('/checkout') || url.startsWith('/onboarding')) {
                return `${baseUrl}${url}`;
            }

            // If user is trying to access sign-in page
            if (url.startsWith('/sign-in')) {
                return `${baseUrl}/redirect`;
            }

            if (url.includes('/api/auth/callback/email')) {
                console.log('=== Email Callback Handler ===');
                console.log('Full URL:', url);
                
                const urlObj = new URL(url);
                const callbackUrl = urlObj.searchParams.get('callbackUrl');
                const token = urlObj.searchParams.get('token');

                // Log the token and callbackUrl for debugging
                console.log('Email callback URL params:', {
                    callbackUrl,
                    token,
                    hasToken: !!token,
                    searchParams: Object.fromEntries(urlObj.searchParams.entries())
                });

                if (callbackUrl) {
                    // If the callback URL is already a full URL, use it directly
                    if (callbackUrl.startsWith('http')) {
                        console.log('Using full callback URL:', callbackUrl);
                        return callbackUrl;
                    }
                    console.log('Using relative callback URL:', callbackUrl);
                    return `${callbackUrl}`;
                }
                console.log('No callback URL, redirecting to /redirect');
                return `${baseUrl}/redirect`;
            }

            // Handle relative URLs
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            }

            // Allow only same-origin URLs
            if (new URL(url).origin === baseUrl) {
                return url;
            }

            return `${baseUrl}/redirect`;
        },
        authorized({ auth, request: { nextUrl } }: AuthorizedCallback) {
            const isLoggedIn = !!auth?.user;
            const isEmailCallback = nextUrl.pathname.startsWith('/api/auth/callback/email');
            const isOnAuthPage = nextUrl.pathname === '/sign-in' || 
                                nextUrl.pathname === '/verify-request';

            // Define public routes that don't require authentication
            const publicRoutes = [
                '/',
                '/contact',
                '/courses',
                '/learning-paths',
                '/checkout/error',
                '/checkout',
                '/onboarding',
                '/checkout/success',
                '/about',
                '/verify-request',
                '/sign-in'
            ];

            // Simplified public routes check
            const isOnPublicPage = publicRoutes.some(route => nextUrl.pathname === route) ||
                nextUrl.pathname.startsWith('/learning-paths/') ||
                nextUrl.pathname.startsWith('/courses/preview/');

            // Allow email verification callback
            if (isEmailCallback) {
                return true;
            }

            // Handle auth pages
            if (isOnAuthPage) {
                if (isLoggedIn) {
                    return Response.redirect(new URL('/redirect', nextUrl));
                }
                return true;
            }

            // Allow access to public pages
            if (isOnPublicPage) {
                return true;
            }

            // Require authentication for all other routes
            if (!isLoggedIn) {
                let callbackUrl = nextUrl.pathname;
                if (nextUrl.search) {
                    callbackUrl += nextUrl.search;
                }
                return Response.redirect(new URL(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`, nextUrl));
            }

            return true;
        }
    }
};