import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TeacherLayout = async ({ children }: { children: React.ReactNode }) => {
  //   const pathName = usePathname();
  const headersList = headers();
  const fullUrl = headersList.get("referer") || "";

  const session = await auth();

  if (!session) redirect("/sign-in");

  return <React.Fragment>{children}</React.Fragment>;
};

export default TeacherLayout;
