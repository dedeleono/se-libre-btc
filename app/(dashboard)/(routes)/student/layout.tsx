import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const StudentLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (!session) redirect("/sign-in");
  if (session.user.role !== UserRole.STUDENT) redirect("/unauthorized");

  const user = await prisma.user.findFirst({
    where: {
      email: session.user?.email as string,
    },
  });

  if (!user || user.role !== UserRole.STUDENT || user.isDeleted || user.isBanned) {
    redirect("/unauthorized");
  }

  return <>{children}</>;
};

export default StudentLayout;
