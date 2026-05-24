import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const StudentLayout = async ({ children }: { children: React.ReactNode }) => {
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

//   console.log(session.expires, "session");
//   console.log(user, "user");

//   if (user?.role !== "STUDENT" && fullUrl.includes("/dashboard/student")) {
//     return redirect("/dashboard");
//   }

  return <>{children}</>;
};

export default StudentLayout;
