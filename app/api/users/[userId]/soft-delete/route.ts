import { requireAdminApi } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  try {
    const authz = await requireAdminApi();
    if (!authz.ok) return authz.response;

    const user = await prisma.user.update({
      where: {
        id: params.userId,
      },
      data: {
        isDeleted: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_SOFT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 