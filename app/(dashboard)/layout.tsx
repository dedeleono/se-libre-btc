import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { DashboardShell } from "./_components/dashboard-shell";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NotificationType } from "@prisma/client";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  senderId: string | null;
  receiverId: string;
  paymentId?: string;
  forumPostId?: string;
  createdAt: string;
  updatedAt: string;
  sender?: {
    name: string | null;
    image: string | null;
  } | null;
}

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  let notifications: Notification[] = [];

  if (session?.user) {
    try {
      const rows = await prisma.notification.findMany({
        where: { receiverId: session.user.id },
        include: { sender: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      });

      notifications = rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        isRead: row.isRead,
        senderId: row.senderId,
        receiverId: row.receiverId,
        paymentId: row.paymentId ?? undefined,
        forumPostId: row.forumPostId ?? undefined,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        sender: row.sender,
      }));
    } catch (error) {
      console.error("[DASHBOARD_NOTIFICATIONS]", error);
    }
  }

  return (
    <DashboardShell
      navbar={
        <Navbar
          notifications={notifications}
          userId={session?.user?.id}
          userRole={session?.user?.role}
        />
      }
      sidebar={<Sidebar />}
    >
      {children}
    </DashboardShell>
  );
};

export default DashboardLayout;
