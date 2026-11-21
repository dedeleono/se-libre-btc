import type { Prisma } from "@prisma/client";

export const publicAuthorSelect = { id: true, name: true, image: true } satisfies Prisma.UserSelect;
export type PublicAuthor = Prisma.UserGetPayload<{ select: typeof publicAuthorSelect }>;
