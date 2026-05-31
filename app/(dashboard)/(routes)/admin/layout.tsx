import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (!session) redirect("/sign-in");
  if (session.user.role !== UserRole.ADMIN) redirect("/unauthorized");

  const user = await prisma.user.findFirst({
    where: {
      email: session.user?.email as string,
    },
  });

  if (!user || user.role !== UserRole.ADMIN || user.isDeleted || user.isBanned) {
    redirect("/unauthorized");
  }

  return <>{children}</>;
};

export default AdminLayout;
