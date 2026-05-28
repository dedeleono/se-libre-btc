import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { Adapter, AdapterUser, AdapterAccount } from "@auth/core/adapters";


declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: UserRole;
  }
}


export const customPrismaAdapter: Adapter = {
  ...PrismaAdapter(prisma),
  createUser: async (data: Omit<AdapterUser, "id">) => {
    const user = await prisma.user.create({
      data: {
        ...data,
        role: data.role ?? "STUDENT",
      },
    });
    return user as AdapterUser;
  },
  getUser: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user as AdapterUser | null;
  },
  getUserByEmail: async (email: string) => {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user as AdapterUser | null;
  },
  getUserByAccount: async (providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">) => {
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: providerAccountId,
      },
      include: {
        user: true,
      },
    });
    return account?.user as AdapterUser | null;
  },
  updateUser: async (data: Partial<AdapterUser> & { id: string }) => {
    const user = await prisma.user.update({
      where: { id: data.id },
      data,
    });
    return user as AdapterUser;
  },
  deleteUser: async (id: string) => {
    await prisma.user.delete({
      where: { id },
    });
  },
  linkAccount: async (data: any) => {
    const account = await prisma.account.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        type: data.type,
        refresh_token: data.refresh_token ?? null,
        access_token: data.access_token ?? null,
        expires_at: data.expires_at ?? null,
        token_type: data.token_type ?? null,
        scope: data.scope ?? null,
        id_token: data.id_token ?? null,
        session_state: data.session_state ?? null,
      },
    });
    return account as unknown as AdapterAccount;
  },
  unlinkAccount: async (providerAccountId: {
    provider: string;
    providerAccountId: string;
  }) => {
    const account = await prisma.account.delete({
      where: {
        provider_providerAccountId: providerAccountId,
      },
    });
    return account as unknown as AdapterAccount;
  },
  createSession: async (data: any) => {
    const session = await prisma.session.create({
      data,
    });
    return session;
  },
  getSessionAndUser: async (sessionToken: string) => {
    const userAndSession = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });
    if (!userAndSession) return null;
    const { user, ...session } = userAndSession;
    return { user: user as AdapterUser, session };
  },
  updateSession: async (data: any) => {
    const session = await prisma.session.update({
      where: { sessionToken: data.sessionToken },
      data,
    });
    return session;
  },
  deleteSession: async (sessionToken: string) => {
    await prisma.session.delete({
      where: { sessionToken },
    });
  },
  createVerificationToken: async (data: any) => {
    const verificationToken = await prisma.verificationToken.create({
      data,
    });
    return verificationToken;
  },
  useVerificationToken: async (identifier_token: { identifier: string; token: string }) => {
    try {
      const verificationToken = await prisma.verificationToken.delete({
        where: { identifier_token },
      });
      return verificationToken;
    } catch (error) {
      return null;
    }
  },
}; 