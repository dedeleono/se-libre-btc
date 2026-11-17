import "server-only";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function createUserSignupNotification(
  newUserId: string,
  userRole: UserRole,
  userName: string
) {
  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      type: "USER_SIGNUP",
      title: "New User Registration",
      body: `${userName} has registered as a ${userRole.toLowerCase()}.`,
      senderId: newUserId,
      receiverId: admin.id,
    })),
  });
}
