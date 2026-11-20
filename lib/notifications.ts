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

export async function listBellNotifications(userId: string) {
  const rows = await prisma.notification.findMany({
    where: { receiverId: userId },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      isRead: true,
      createdAt: true,
      paymentId: true,
      forumPostId: true,
      courseId: true,
      learningPathId: true,
      sender: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    ...row,
    paymentId: row.paymentId ?? undefined,
    forumPostId: row.forumPostId ?? undefined,
    courseId: row.courseId ?? undefined,
    learningPathId: row.learningPathId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }));
}
