import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";

import { prisma } from "@/lib/db";
import { sendAuthEmail } from "@/lib/validations/auth-email";

const DEFAULT_AUTH_REDIRECT = "/api/auth/post-login";

type AppUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  isDeleted: boolean;
  isBanned: boolean;
};

export type AppSession = {
  user: AppUser;
  session?: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  };
};

export const betterAuthServer = betterAuth({
  appName: "Se Libre",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["ADMIN", "STUDENT"],
        required: false,
        defaultValue: UserRole.STUDENT,
        input: false,
      },
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      onboardingCompleted: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      isDeleted: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      isBanned: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
  ].filter(Boolean) as string[],
  rateLimit: {
    window: 60,
    max: 100,
  },
  plugins: [
    magicLink({
      expiresIn: 10 * 60,
      rateLimit: {
        window: 60,
        max: 5,
      },
      sendMagicLink: async ({ email, url }) => {
        await sendAuthEmail(email, url);
      },
    }),
    nextCookies(),
  ],
});

function toAppSession(session: unknown): AppSession | null {
  if (!session || typeof session !== "object") return null;

  const sessionWithUser = session as {
    user?: Partial<AppUser> & Record<string, unknown>;
    session?: AppSession["session"];
  };

  if (!sessionWithUser.user?.id || !sessionWithUser.user.email) return null;

  return {
    ...sessionWithUser,
    user: {
      id: sessionWithUser.user.id,
      email: sessionWithUser.user.email,
      name: (sessionWithUser.user.name as string | null | undefined) ?? null,
      image: (sessionWithUser.user.image as string | null | undefined) ?? null,
      role: (sessionWithUser.user.role as UserRole | undefined) ?? UserRole.STUDENT,
      emailVerified: Boolean(sessionWithUser.user.emailVerified),
      onboardingCompleted: Boolean(sessionWithUser.user.onboardingCompleted),
      isDeleted: Boolean(sessionWithUser.user.isDeleted),
      isBanned: Boolean(sessionWithUser.user.isBanned),
    },
  };
}

export async function getSession(options?: { allowInactive?: boolean }) {
  const rawSession = await betterAuthServer.api.getSession({
    headers: headers(),
  });

  const session = toAppSession(rawSession);
  if (!session) return null;

  if (!options?.allowInactive && (session.user.isDeleted || session.user.isBanned)) {
    return null;
  }

  return session;
}

export async function auth() {
  return getSession();
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireRole(role: UserRole) {
  const session = await requireSession();

  if (session.user.role !== role) {
    redirect("/unauthorized");
  }

  return session;
}

export function getRoleRedirect(user: Pick<AppUser, "role" | "onboardingCompleted">) {
  if (!user.onboardingCompleted) return "/onboarding";
  return user.role === UserRole.ADMIN ? "/admin" : "/student";
}

export function getPostLoginRedirect(session: AppSession | null) {
  if (!session?.user || session.user.isDeleted || session.user.isBanned) {
    return "/sign-in";
  }

  return getRoleRedirect(session.user);
}

export function getSafeCallbackUrl(callbackUrl?: string | null, origin?: string) {
  if (!callbackUrl) return null;

  try {
    const base = origin ?? process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = new URL(callbackUrl, base);
    const baseUrl = new URL(base);

    if (url.origin !== baseUrl.origin) return null;

    const value = `${url.pathname}${url.search}${url.hash}`;
    if (value === "/sign-in" || value.startsWith("/api/auth")) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

export function getDefaultAuthRedirect(callbackUrl?: string | null, origin?: string) {
  return getSafeCallbackUrl(callbackUrl, origin) ?? DEFAULT_AUTH_REDIRECT;
}
