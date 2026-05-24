import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
//   const pathName = usePathname();
  const headersList = headers();
  const fullUrl = headersList.get("referer") || "";

  const session = await auth();

  if (!session) redirect("/sign-in");

  const user = await prisma.user.findFirst({
    where: {
      email: session.user?.email as string,
    },
  });

  // if (user?.role !== "ADMIN" && fullUrl.includes("/admin")) {
  //   return redirect("/");
  // }

  return <>{children}</>;
};

export default AdminLayout;
