import NextAuth from "next-auth";
import { prisma } from "@/lib/db";
import { sendAuthEmail } from "./validations/auth-email";
import { authConfig } from "./auth.config";
import { UserRole } from "@prisma/client";
import Email from "next-auth/providers/email";
import { customPrismaAdapter } from "./auth-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: customPrismaAdapter,
    session: { strategy: "jwt" },
    secret: process.env.AUTH_SECRET,
    providers: [
        ...authConfig.providers,
        Email({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD
                }
            },
            from: process.env.EMAIL_FROM,
            maxAge: 10 * 60,
            async sendVerificationRequest({ identifier: email, url }) {
                try {
                    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
                        console.error('Missing email configuration:', {
                            hasEmailUser: !!process.env.EMAIL_SERVER_USER,
                            hasEmailPassword: !!process.env.EMAIL_SERVER_PASSWORD,
                            emailHost: process.env.EMAIL_SERVER_HOST,
                            emailPort: process.env.EMAIL_SERVER_PORT
                        });
                        throw new Error('Missing required email configuration');
                    }

                    await sendAuthEmail(email, url);
                    console.log('Verification email sent successfully');
                } catch (error) {
                    console.error('Error in sendVerificationRequest:', error);
                    throw error;
                }
            }
        }),
    ],
    // pages: {
    //     ...authConfig.pages,
    //     verifyRequest: '/verify-request',
    // },
    callbacks: {
        ...authConfig.callbacks,
        
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string;
                session.user.role = token.role as UserRole;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.emailVerified = token.emailVerified as Date | null;
            }
            return session;
        },
        async jwt({ token, user, account }) {
            if (user) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email! },
                    select: {
                        id: true,
                        role: true,
                        name: true,
                        email: true,
                        emailVerified: true,
                    }
                });
                if (dbUser) {
                    token.role = dbUser.role;
                    token.name = dbUser.name;
                    token.email = dbUser.email;
                    token.emailVerified = dbUser.emailVerified;
                }
            }
            return token;
        }
    },
});

export type AuthSession = {
    session: {
        user: {
            id: string;
            email: string;
            role: UserRole;
            name?: string | null;
            image?: string | null;
        };
    } | null;
};